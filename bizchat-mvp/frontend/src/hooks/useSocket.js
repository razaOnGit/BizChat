import { useEffect, useRef } from 'react';
import socketService from '../services/socket';

export const useSocket = (businessId) => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = socketService.connect();
    socketService.joinBusiness(businessId);

    return () => {
      socketService.disconnect();
    };
  }, [businessId]);

  return socketRef.current;
};