import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  electionsTable,
  postsTable,
  candidatesTable,
  votersTable,
  votesTable,
  auditLogsTable,
} from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";

const router: IRouter = Router();

async function addAuditLog(
  electionId: number,
  action: string,
  details?: string
) {
  await db.insert(auditLogsTable).values({ electionId, action, details });
}

function electionToResponse(
  election: typeof electionsTable.$inferSelect,
  totalVoters = 0,
  totalVotesCast = 0
) {
  return {
    id: election.id,
    name: election.name,
    description: election.description ?? undefined,
    collegeName: election.collegeName,
    status: election.status,
    adminPasscode: election.adminPasscode,
    openEnrollment: election.openEnrollment,
    votingStartsAt: election.votingStartsAt?.toISOString() ?? null,
    votingEndsAt: election.votingEndsAt?.toISOString() ?? null,
    createdAt: election.createdAt.toISOString(),
    updatedAt: election.updatedAt.toISOString(),
    totalVoters,
    totalVotesCast,
  };
}

async function getElectionCounts(electionId: number) {
  const [voterCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(votersTable)
    .where(eq(votersTable.electionId, electionId));

  const [voteCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(votersTable)
    .where(
      and(
        eq(votersTable.electionId, electionId),
        eq(votersTable.hasVoted, true)
      )
    );

  return {
    totalVoters: voterCount?.count ?? 0,
    totalVotesCast: voteCount?.count ?? 0,
  };
}

router.get("/elections", async (_req, res) => {
  const elections = await db.select().from(electionsTable);
  const result = await Promise.all(
    elections.map(async (e) => {
      const counts = await getElectionCounts(e.id);
      return electionToResponse(e, counts.totalVoters, counts.totalVotesCast);
    })
  );
  res.json(result);
});

router.post("/elections", async (req, res) => {
  const { name, description, collegeName, adminPasscode, votingStartsAt, votingEndsAt } =
    req.body;

  if (!name || !collegeName || !adminPasscode) {
    res.status(400).json({ error: "name, collegeName, adminPasscode are required" });
    return;
  }

  const [election] = await db
    .insert(electionsTable)
    .values({
      name,
      description,
      collegeName,
      adminPasscode,
      votingStartsAt: votingStartsAt ? new Date(votingStartsAt) : null,
      votingEndsAt: votingEndsAt ? new Date(votingEndsAt) : null,
    })
    .returning();

  await addAuditLog(election.id, "ELECTION_CREATED", `Election "${name}" created for ${collegeName}`);
  res.status(201).json(electionToResponse(election, 0, 0));
});

router.get("/elections/:electionId", async (req, res) => {
  const electionId = parseInt(req.params.electionId);
  const [election] = await db
    .select()
    .from(electionsTable)
    .where(eq(electionsTable.id, electionId));

  if (!election) {
    res.status(404).json({ error: "Election not found" });
    return;
  }
  const counts = await getElectionCounts(electionId);
  res.json(electionToResponse(election, counts.totalVoters, counts.totalVotesCast));
});

router.put("/elections/:electionId", async (req, res) => {
  const electionId = parseInt(req.params.electionId);
  const { name, description, collegeName, votingStartsAt, votingEndsAt, openEnrollment } = req.body;

  const [election] = await db
    .update(electionsTable)
    .set({
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(collegeName && { collegeName }),
      ...(openEnrollment !== undefined && { openEnrollment }),
      ...(votingStartsAt !== undefined && {
        votingStartsAt: votingStartsAt ? new Date(votingStartsAt) : null,
      }),
      ...(votingEndsAt !== undefined && {
        votingEndsAt: votingEndsAt ? new Date(votingEndsAt) : null,
      }),
      updatedAt: new Date(),
    })
    .where(eq(electionsTable.id, electionId))
    .returning();

  if (!election) {
    res.status(404).json({ error: "Election not found" });
    return;
  }
  if (openEnrollment !== undefined) {
    await addAuditLog(
      electionId,
      "OPEN_ENROLLMENT_TOGGLED",
      `Open enrollment ${openEnrollment ? "enabled" : "disabled"} — any student with a university ID can vote`
    );
  } else {
    await addAuditLog(electionId, "ELECTION_UPDATED", `Election details updated`);
  }
  const counts = await getElectionCounts(electionId);
  res.json(electionToResponse(election, counts.totalVoters, counts.totalVotesCast));
});

router.delete("/elections/:electionId", async (req, res) => {
  const electionId = parseInt(req.params.electionId);
  await db.delete(electionsTable).where(eq(electionsTable.id, electionId));
  res.json({ message: "Election deleted" });
});

router.put("/elections/:electionId/status", async (req, res) => {
  const electionId = parseInt(req.params.electionId);
  const { status, adminPasscode } = req.body;

  const [existing] = await db
    .select()
    .from(electionsTable)
    .where(eq(electionsTable.id, electionId));

  if (!existing) {
    res.status(404).json({ error: "Election not found" });
    return;
  }

  if (existing.adminPasscode !== adminPasscode) {
    res.status(403).json({ error: "Invalid admin passcode" });
    return;
  }

  const [election] = await db
    .update(electionsTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(electionsTable.id, electionId))
    .returning();

  await addAuditLog(electionId, "STATUS_CHANGED", `Election status changed to "${status}"`);
  const counts = await getElectionCounts(electionId);
  res.json(electionToResponse(election, counts.totalVoters, counts.totalVotesCast));
});

router.get("/elections/:electionId/posts", async (req, res) => {
  const electionId = parseInt(req.params.electionId);
  const posts = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.electionId, electionId));

  res.json(
    posts.map((p) => ({
      id: p.id,
      electionId: p.electionId,
      title: p.title,
      description: p.description ?? undefined,
      maxVotesPerVoter: p.maxVotesPerVoter,
      createdAt: p.createdAt.toISOString(),
    }))
  );
});

router.post("/elections/:electionId/posts", async (req, res) => {
  const electionId = parseInt(req.params.electionId);
  const { title, description, maxVotesPerVoter } = req.body;

  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  const [post] = await db
    .insert(postsTable)
    .values({
      electionId,
      title,
      description,
      maxVotesPerVoter: maxVotesPerVoter ?? 1,
    })
    .returning();

  await addAuditLog(electionId, "POST_CREATED", `Post "${title}" added`);
  res.status(201).json({
    id: post.id,
    electionId: post.electionId,
    title: post.title,
    description: post.description ?? undefined,
    maxVotesPerVoter: post.maxVotesPerVoter,
    createdAt: post.createdAt.toISOString(),
  });
});

router.delete("/posts/:postId", async (req, res) => {
  const postId = parseInt(req.params.postId);
  const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, postId));
  if (post) {
    await db.delete(postsTable).where(eq(postsTable.id, postId));
    await addAuditLog(post.electionId, "POST_DELETED", `Post "${post.title}" deleted`);
  }
  res.json({ message: "Post deleted" });
});

router.get("/posts/:postId/candidates", async (req, res) => {
  const postId = parseInt(req.params.postId);
  const candidates = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.postId, postId));

  res.json(
    candidates.map((c) => ({
      id: c.id,
      postId: c.postId,
      name: c.name,
      rollNumber: c.rollNumber,
      department: c.department,
      year: c.year,
      manifesto: c.manifesto ?? undefined,
      photoUrl: c.photoUrl ?? null,
      voteCount: c.voteCount,
      createdAt: c.createdAt.toISOString(),
    }))
  );
});

router.post("/posts/:postId/candidates", async (req, res) => {
  const postId = parseInt(req.params.postId);
  const { name, rollNumber, department, year, manifesto, photoUrl } = req.body;

  if (!name || !rollNumber || !department || !year) {
    res.status(400).json({ error: "name, rollNumber, department, year are required" });
    return;
  }

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId));
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const [candidate] = await db
    .insert(candidatesTable)
    .values({ postId, name, rollNumber, department, year, manifesto, photoUrl })
    .returning();

  await addAuditLog(post.electionId, "CANDIDATE_ADDED", `Candidate "${name}" added to "${post.title}"`);
  res.status(201).json({
    id: candidate.id,
    postId: candidate.postId,
    name: candidate.name,
    rollNumber: candidate.rollNumber,
    department: candidate.department,
    year: candidate.year,
    manifesto: candidate.manifesto ?? undefined,
    photoUrl: candidate.photoUrl ?? null,
    voteCount: candidate.voteCount,
    createdAt: candidate.createdAt.toISOString(),
  });
});

router.delete("/candidates/:candidateId", async (req, res) => {
  const candidateId = parseInt(req.params.candidateId);
  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, candidateId));
  if (candidate) {
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, candidate.postId));
    await db.delete(candidatesTable).where(eq(candidatesTable.id, candidateId));
    if (post) {
      await addAuditLog(post.electionId, "CANDIDATE_REMOVED", `Candidate "${candidate.name}" removed`);
    }
  }
  res.json({ message: "Candidate deleted" });
});

router.post("/elections/:electionId/vote", async (req, res) => {
  const electionId = parseInt(req.params.electionId);
  const { voterId, votes } = req.body;

  if (!voterId || !Array.isArray(votes) || votes.length === 0) {
    res.status(400).json({ error: "voterId and votes are required" });
    return;
  }

  const [election] = await db
    .select()
    .from(electionsTable)
    .where(eq(electionsTable.id, electionId));

  if (!election) {
    res.status(404).json({ error: "Election not found" });
    return;
  }

  if (election.status !== "voting") {
    res.status(400).json({ error: "Voting is not currently open for this election" });
    return;
  }

  const [voter] = await db
    .select()
    .from(votersTable)
    .where(
      and(
        eq(votersTable.electionId, electionId),
        eq(votersTable.voterId, voterId)
      )
    );

  if (!voter) {
    res.status(400).json({ error: "Voter ID is not registered for this election" });
    return;
  }

  if (voter.hasVoted) {
    res.status(400).json({ error: "You have already voted in this election" });
    return;
  }

  for (const vote of votes) {
    const { postId, candidateId } = vote;
    await db
      .insert(votesTable)
      .values({ electionId, postId, candidateId, voterId });
    await db
      .update(candidatesTable)
      .set({ voteCount: sql`vote_count + 1` })
      .where(eq(candidatesTable.id, candidateId));
  }

  await db
    .update(votersTable)
    .set({ hasVoted: true, votedAt: new Date() })
    .where(eq(votersTable.id, voter.id));

  await addAuditLog(electionId, "VOTE_CAST", `Voter "${voterId}" successfully cast their vote`);
  res.status(201).json({ message: "Vote cast successfully" });
});

router.get("/elections/:electionId/results", async (req, res) => {
  const electionId = parseInt(req.params.electionId);

  const [election] = await db
    .select()
    .from(electionsTable)
    .where(eq(electionsTable.id, electionId));

  if (!election) {
    res.status(404).json({ error: "Election not found" });
    return;
  }

  const counts = await getElectionCounts(electionId);
  const posts = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.electionId, electionId));

  const results = await Promise.all(
    posts.map(async (post) => {
      const candidates = await db
        .select()
        .from(candidatesTable)
        .where(eq(candidatesTable.postId, post.id));

      const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);

      const candidateResults = candidates.map((c) => ({
        candidate: {
          id: c.id,
          postId: c.postId,
          name: c.name,
          rollNumber: c.rollNumber,
          department: c.department,
          year: c.year,
          manifesto: c.manifesto ?? undefined,
          photoUrl: c.photoUrl ?? null,
          voteCount: c.voteCount,
          createdAt: c.createdAt.toISOString(),
        },
        voteCount: c.voteCount,
        percentage: totalVotes > 0 ? Math.round((c.voteCount / totalVotes) * 100 * 10) / 10 : 0,
      }));

      candidateResults.sort((a, b) => b.voteCount - a.voteCount);

      const winner =
        election.status === "results" && candidateResults.length > 0
          ? candidateResults[0]
          : null;

      return {
        post: {
          id: post.id,
          electionId: post.electionId,
          title: post.title,
          description: post.description ?? undefined,
          maxVotesPerVoter: post.maxVotesPerVoter,
          createdAt: post.createdAt.toISOString(),
        },
        candidates: candidateResults,
        winner,
        totalVotes,
      };
    })
  );

  res.json({
    election: electionToResponse(election, counts.totalVoters, counts.totalVotesCast),
    results,
  });
});

router.get("/elections/:electionId/voters", async (req, res) => {
  const electionId = parseInt(req.params.electionId);
  const voters = await db
    .select()
    .from(votersTable)
    .where(eq(votersTable.electionId, electionId));

  res.json(
    voters.map((v) => ({
      id: v.id,
      electionId: v.electionId,
      voterId: v.voterId,
      name: v.name,
      email: v.email ?? null,
      hasVoted: v.hasVoted,
      votedAt: v.votedAt?.toISOString() ?? null,
      createdAt: v.createdAt.toISOString(),
    }))
  );
});

router.post("/elections/:electionId/voters", async (req, res) => {
  const electionId = parseInt(req.params.electionId);
  const { voterId, name, email } = req.body;

  if (!voterId || !name) {
    res.status(400).json({ error: "voterId and name are required" });
    return;
  }

  const existing = await db
    .select()
    .from(votersTable)
    .where(
      and(eq(votersTable.electionId, electionId), eq(votersTable.voterId, voterId))
    );

  if (existing.length > 0) {
    res.status(400).json({ error: "Voter ID already registered" });
    return;
  }

  const [voter] = await db
    .insert(votersTable)
    .values({ electionId, voterId, name, email })
    .returning();

  await addAuditLog(electionId, "VOTER_REGISTERED", `Voter "${name}" (${voterId}) registered`);
  res.status(201).json({
    id: voter.id,
    electionId: voter.electionId,
    voterId: voter.voterId,
    name: voter.name,
    email: voter.email ?? null,
    hasVoted: voter.hasVoted,
    votedAt: voter.votedAt?.toISOString() ?? null,
    createdAt: voter.createdAt.toISOString(),
  });
});

router.post("/elections/:electionId/voters/bulk", async (req, res) => {
  const electionId = parseInt(req.params.electionId);
  const { voters } = req.body;

  if (!Array.isArray(voters) || voters.length === 0) {
    res.status(400).json({ error: "voters array is required" });
    return;
  }

  let registered = 0;
  let skipped = 0;

  for (const v of voters) {
    if (!v.voterId || !v.name) {
      skipped++;
      continue;
    }
    const existing = await db
      .select()
      .from(votersTable)
      .where(
        and(eq(votersTable.electionId, electionId), eq(votersTable.voterId, v.voterId))
      );

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    await db.insert(votersTable).values({
      electionId,
      voterId: v.voterId,
      name: v.name,
      email: v.email ?? null,
    });
    registered++;
  }

  await addAuditLog(
    electionId,
    "BULK_VOTER_IMPORT",
    `Bulk import: ${registered} registered, ${skipped} skipped`
  );
  res.status(201).json({ registered, skipped, total: voters.length });
});

router.post("/elections/:electionId/check-voter", async (req, res) => {
  const electionId = parseInt(req.params.electionId);
  const { voterId, name } = req.body;

  if (!voterId) {
    res.status(400).json({ error: "voterId is required" });
    return;
  }

  const [election] = await db
    .select()
    .from(electionsTable)
    .where(eq(electionsTable.id, electionId));

  if (!election) {
    res.status(404).json({ error: "Election not found" });
    return;
  }

  const [voter] = await db
    .select()
    .from(votersTable)
    .where(
      and(eq(votersTable.electionId, electionId), eq(votersTable.voterId, voterId))
    );

  if (!voter) {
    // If open enrollment is enabled, auto-register this student
    if (election.openEnrollment) {
      const voterName = name?.trim() || voterId;
      const [newVoter] = await db
        .insert(votersTable)
        .values({ electionId, voterId, name: voterName })
        .returning();
      await addAuditLog(
        electionId,
        "VOTER_AUTO_REGISTERED",
        `Voter "${voterName}" (${voterId}) auto-registered via open enrollment`
      );
      res.json({
        isRegistered: true,
        hasVoted: newVoter.hasVoted,
        voterId: newVoter.voterId,
        name: newVoter.name,
        autoRegistered: true,
      });
      return;
    }
    res.json({ isRegistered: false, hasVoted: false, voterId });
    return;
  }

  res.json({
    isRegistered: true,
    hasVoted: voter.hasVoted,
    voterId: voter.voterId,
    name: voter.name,
  });
});

router.get("/elections/:electionId/audit", async (req, res) => {
  const electionId = parseInt(req.params.electionId);
  const logs = await db
    .select()
    .from(auditLogsTable)
    .where(eq(auditLogsTable.electionId, electionId));

  res.json(
    logs.map((l) => ({
      id: l.id,
      electionId: l.electionId,
      action: l.action,
      details: l.details ?? undefined,
      createdAt: l.createdAt.toISOString(),
    }))
  );
});

export default router;
