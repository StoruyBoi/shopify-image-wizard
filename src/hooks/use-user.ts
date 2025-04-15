
import { useContext } from 'react';
import { UserContext } from '@/App';

export const useUser = () => {
  return useContext(UserContext);
};
