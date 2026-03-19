import { useState, useEffect } from 'react';

// Manages admin passcodes per election in localStorage
export function useAdminAuth(electionId: number | string) {
  const key = `votecast_admin_${electionId}`;
  
  const [passcode, setPasscodeState] = useState<string | null>(() => {
    return localStorage.getItem(key);
  });

  const setPasscode = (code: string | null) => {
    if (code) {
      localStorage.setItem(key, code);
      setPasscodeState(code);
    } else {
      localStorage.removeItem(key);
      setPasscodeState(null);
    }
  };

  const logout = () => setPasscode(null);

  return { passcode, setPasscode, logout, isAuthenticated: !!passcode };
}
