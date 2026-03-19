import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const electionStatusEnum = pgEnum("election_status", [
  "draft",
  "nomination",
  "voting",
  "results",
  "closed",
]);

export const electionsTable = pgTable("elections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  collegeName: text("college_name").notNull(),
  status: electionStatusEnum("status").notNull().default("draft"),
  adminPasscode: text("admin_passcode").notNull(),
  votingStartsAt: timestamp("voting_starts_at"),
  votingEndsAt: timestamp("voting_ends_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertElectionSchema = createInsertSchema(electionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertElection = z.infer<typeof insertElectionSchema>;
export type Election = typeof electionsTable.$inferSelect;

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id")
    .notNull()
    .references(() => electionsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  maxVotesPerVoter: integer("max_votes_per_voter").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;

export const candidatesTable = pgTable("candidates", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => postsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  rollNumber: text("roll_number").notNull(),
  department: text("department").notNull(),
  year: text("year").notNull(),
  manifesto: text("manifesto"),
  photoUrl: text("photo_url"),
  voteCount: integer("vote_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCandidateSchema = createInsertSchema(candidatesTable).omit({
  id: true,
  voteCount: true,
  createdAt: true,
});
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidatesTable.$inferSelect;

export const votersTable = pgTable("voters", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id")
    .notNull()
    .references(() => electionsTable.id, { onDelete: "cascade" }),
  voterId: text("voter_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  hasVoted: boolean("has_voted").notNull().default(false),
  votedAt: timestamp("voted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVoterSchema = createInsertSchema(votersTable).omit({
  id: true,
  hasVoted: true,
  votedAt: true,
  createdAt: true,
});
export type InsertVoter = z.infer<typeof insertVoterSchema>;
export type Voter = typeof votersTable.$inferSelect;

export const votesTable = pgTable("votes", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id")
    .notNull()
    .references(() => electionsTable.id, { onDelete: "cascade" }),
  postId: integer("post_id")
    .notNull()
    .references(() => postsTable.id, { onDelete: "cascade" }),
  candidateId: integer("candidate_id")
    .notNull()
    .references(() => candidatesTable.id, { onDelete: "cascade" }),
  voterId: text("voter_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVoteSchema = createInsertSchema(votesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votesTable.$inferSelect;

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id")
    .notNull()
    .references(() => electionsTable.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogsTable.$inferSelect;
