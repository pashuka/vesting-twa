import { CircularProgress as JoyCircularProgress, circularProgressClasses, styled } from '@mui/joy';

export const CircularProgress = styled(JoyCircularProgress)({
  [`& .${circularProgressClasses.progress}`]: {
    animationDuration: '2.5s',
  },
});
