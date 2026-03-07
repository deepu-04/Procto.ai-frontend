import React from 'react';
import { Box, Typography, Button, styled, keyframes } from '@mui/material';
import { Link } from 'react-router-dom';


const connectLeft = keyframes`
  0%, 100% { transform: translate(-80px, 20px) rotate(-10deg); }
  12.5%, 25% { transform: translate(40px, 0px) rotate(0deg); } /* Fully Inserted & Holding */
  26% { transform: translate(-60px, 15px) rotate(-5deg); } /* Violent blowback */
  35%, 90% { transform: translate(-70px, 25px) rotate(-8deg); } /* Settled broken state */
`;

const connectRight = keyframes`
  0%, 100% { transform: translate(80px, -20px) rotate(10deg); }
  12.5%, 25% { transform: translate(-40px, 0px) rotate(0deg); } /* Fully Inserted & Holding */
  26% { transform: translate(60px, -15px) rotate(5deg); } /* Violent blowback */
  35%, 90% { transform: translate(70px, -25px) rotate(8deg); } /* Settled broken state */
`;

const blastFlash = keyframes`
  0%, 24.9% { opacity: 0; transform: scale(0.5); }
  25% { opacity: 1; transform: scale(3.5); fill: #FFF; }
  27% { opacity: 1; transform: scale(2.5); fill: #E85A4F; }
  32%, 100% { opacity: 0; transform: scale(1); fill: #4A4F55; }
`;

const shake = keyframes`
  0%, 24.9% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(-15px, -15px) rotate(-2deg); }
  26% { transform: translate(15px, 15px) rotate(2deg); }
  27% { transform: translate(-15px, 10px) rotate(-1deg); }
  28% { transform: translate(15px, -10px) rotate(1deg); }
  29%, 100% { transform: translate(0, 0) rotate(0deg); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
`;

const textBlastIn = keyframes`
  0% { opacity: 0; transform: translateY(40px) scale(0.8); filter: blur(8px); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
`;


const PageWrapper = styled(Box)({
  minHeight: '100vh',
  backgroundColor: '#B5C6D3', 
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  overflow: 'hidden',
  fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", sans-serif',
});

const SVGContainer = styled(Box)({
  width: '100%',
  maxWidth: '600px',
  marginBottom: '10px',
  animation: `${shake} 4s infinite`, 
});

const BrandText = styled(Typography)({
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#4A4F55',
  textTransform: 'uppercase',
  letterSpacing: '3px',
  opacity: 0,
  animation: `${textBlastIn} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1s forwards`,
});

const OopsText = styled(Typography)({
  fontSize: '5rem',
  fontWeight: 900,
  color: '#E85A4F', 
  textTransform: 'uppercase',
  letterSpacing: '2px',
  lineHeight: 1,
  opacity: 0,
  animation: `${textBlastIn} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1.1s forwards`,
  marginBottom: '30px',
  textAlign: 'center',
});

const ActionButton = styled(Button)({
  opacity: 0,
  animation: `${textBlastIn} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1.4s forwards`,
  backgroundColor: '#4A4F55',
  color: '#FFF',
  padding: '12px 32px',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  borderRadius: '12px',
  textTransform: 'none',
  boxShadow: '0 8px 20px rgba(74, 79, 85, 0.3)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: '#35393D',
    boxShadow: '0 10px 25px rgba(74, 79, 85, 0.4)',
    transform: 'translateY(-3px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  }
});

const ErrorPage = () => {
  return (
    <PageWrapper>
      <SVGContainer>
        <svg viewBox="0 0 600 400" width="100%" height="100%" style={{ overflow: 'visible' }}>
          
          <path
            d="M170 120 C 230 40, 420 40, 480 130 C 530 210, 440 330, 270 330 C 130 330, 100 210, 170 120 Z"
            fill="#C7D5DC"
            style={{ animation: `${float} 8s ease-in-out infinite` }}
          />

          <g style={{ animation: `${float} 6s ease-in-out infinite reverse` }}>
            <path d="M180,90 L190,100 M190,90 L180,100" stroke="#9BAFB9" strokeWidth="3" strokeLinecap="round" />
            <rect x="250" y="80" width="8" height="8" rx="2" fill="#9BAFB9" />
            <path d="M380,100 L390,110 M390,100 L380,110" stroke="#9BAFB9" strokeWidth="3" strokeLinecap="round" />
            <rect x="420" y="140" width="6" height="6" rx="1" fill="#9BAFB9" />
            <rect x="160" y="280" width="8" height="8" rx="2" fill="#9BAFB9" />
            <path d="M250,300 L260,310 M260,300 L250,310" stroke="#9BAFB9" strokeWidth="3" strokeLinecap="round" />
            <rect x="330" y="320" width="6" height="6" rx="1" fill="#9BAFB9" />
            <path d="M430,270 L440,280 M440,270 L430,280" stroke="#9BAFB9" strokeWidth="3" strokeLinecap="round" />
          </g>

          <g style={{ transformOrigin: '400px 200px', animation: `${connectRight} 4s infinite` }}>
            <path d="M 800 150 Q 600 150 420 200" fill="none" stroke="#4A4F55" strokeWidth="8" strokeLinecap="round" />
            <rect x="270" y="185" width="50" height="8" rx="2" fill="#4A4F55" />
            <rect x="270" y="207" width="50" height="8" rx="2" fill="#4A4F55" />
            <rect x="350" y="160" width="70" height="80" rx="12" fill="#6F767D" />
            <path d="M 350 175 L 320 180 L 320 220 L 350 225 Z" fill="#5F666C" />
            <rect x="395" y="170" width="6" height="60" rx="3" fill="#4A4F55" />
            <rect x="380" y="170" width="6" height="60" rx="3" fill="#4A4F55" />
          </g>

          <g style={{ transformOrigin: '200px 200px', animation: `${connectLeft} 4s infinite` }}>
            <path d="M -200 250 Q 0 250 130 200" fill="none" stroke="#4A4F55" strokeWidth="8" strokeLinecap="round" />
            <rect x="110" y="160" width="70" height="80" rx="12" fill="#6F767D" />
            <path d="M 180 175 L 210 180 L 210 220 L 180 225 Z" fill="#5F666C" />
            <rect x="130" y="170" width="6" height="60" rx="3" fill="#4A4F55" />
            <rect x="145" y="170" width="6" height="60" rx="3" fill="#4A4F55" />
            <rect x="200" y="185" width="8" height="8" rx="2" fill="#35393D" />
            <rect x="200" y="207" width="8" height="8" rx="2" fill="#35393D" />
          </g>

          <g style={{ transformOrigin: '300px 200px', animation: `${blastFlash} 4s infinite` }}>
            <circle cx="300" cy="200" r="60" fill="#FFF" opacity="0.6" filter="blur(12px)" />
            <path d="M 300 120 L 320 180 L 380 170 L 330 210 L 360 270 L 300 230 L 240 270 L 270 210 L 220 170 L 280 180 Z" fill="#E85A4F" />
            <path d="M 300 150 L 310 190 L 340 185 L 315 205 L 330 240 L 300 215 L 270 240 L 285 205 L 260 185 L 290 190 Z" fill="#FFF" />
            <circle cx="220" cy="120" r="5" fill="#E85A4F" />
            <circle cx="380" cy="280" r="8" fill="#FFF" />
            <circle cx="400" cy="140" r="6" fill="#E85A4F" />
            <circle cx="200" cy="260" r="4" fill="#FFF" />
          </g>
        </svg>
      </SVGContainer>

      <BrandText>Procto.ai says</BrandText>
      <OopsText>404 Error</OopsText>
      
      <ActionButton variant="contained" component={Link} to="/dashboard" disableElevation>
        Back to Dashboard
      </ActionButton>

    </PageWrapper>
  );
};

export default ErrorPage;