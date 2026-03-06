import { Link } from 'react-router-dom';
import { styled } from '@mui/material';
import LogoDark from 'src/assets/images/logos/dark-logo.png';

const LinkStyled = styled(Link)(() => ({
  height: '90px',
  width: '200px',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  marginRight: '10px',
}));

const Logo = () => {
  return (
    <LinkStyled to="/">
      <img src={LogoDark} alt="Logo" height={70} style={{ objectFit: 'contain' }} />
    </LinkStyled>
  );
};

export default Logo;
