import * as React from 'react';
import Backdrop from '@mui/material/Backdrop';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import SecurityIcon from '@mui/icons-material/Security';


const floatTop = keyframes`
  0%, 100% { transform: translateZ(50px); }
  50% { transform: translateZ(80px); }
`;

const floatMid = keyframes`
  0%, 100% { transform: translateZ(25px); }
  50% { transform: translateZ(40px); }
`;

const floatBot = keyframes`
  0%, 100% { transform: translateZ(0px); box-shadow: -10px 10px 20px rgba(0,0,0,0.3); }
  50% { transform: translateZ(-5px); box-shadow: -20px 20px 40px rgba(0,0,0,0.5); }
`;

const scanLaser = keyframes`
  0% { top: -20%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 120%; opacity: 0; }
`;

const pulseText = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

export default function Loader() {
  return (
    <Backdrop
      open
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 999,
        backgroundColor: 'rgba(15, 23, 42, 0.85)', 
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      
      <Box
        sx={{
          position: 'relative',
          width: 200,
          height: 250,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
       
        <Box
          sx={{
            position: 'absolute',
            left: '-10%',
            width: '120%',
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #00E5FF, transparent)',
            boxShadow: '0px 0px 15px 3px rgba(0, 229, 255, 0.6)',
            animation: `${scanLaser} 2s infinite ease-in-out`,
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />

       
        <Box
          sx={{
            position: 'relative',
            width: 100,
            height: 100,
            transformStyle: 'preserve-3d',
            transform: 'rotateX(60deg) rotateZ(45deg)', 
          }}
        >
          
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#1D4ED8', 
              borderRadius: '24px',
              animation: `${floatBot} 2.5s ease-in-out infinite`,
            }}
          />

          
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#3B82F6', 
              borderRadius: '24px',
              animation: `${floatMid} 2.5s ease-in-out infinite`,
            }}
          />

          
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#DDF2FF', 
              borderRadius: '24px',
              animation: `${floatTop} 2.5s ease-in-out infinite`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
          
            <SecurityIcon
              sx={{
                color: '#0F172A', 
                fontSize: 50,
              }}
            />
          </Box>
        </Box>
      </Box>

     
      <Typography
        variant="subtitle1"
        sx={{
          mt: 4,
          fontWeight: 800,
          letterSpacing: 3,
          color: '#00E5FF', 
          textTransform: 'uppercase',
          animation: `${pulseText} 1.5s ease-in-out infinite`,
        }}
      >
        Securing Environment...
      </Typography>
    </Backdrop>
  );
}
