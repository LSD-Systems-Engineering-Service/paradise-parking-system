export const formatMinutes = (minutes: number | null) => {
  if (!minutes || minutes === 0) return 'N/A';
  
  if (minutes < 60) {
    return `${minutes} mins`; 
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  
  return `${hours} hr${hours > 1 ? 's' : ''} and ${remainingMinutes} mins`;
};
