import React from 'react';

interface LinkProps {
  children: React.ReactNode;
  href: string;
  className?: string;
  [key: string]: any;
}

const Link = ({ children, href, ...rest }: LinkProps) => (
  <a href={href} {...rest}>{children}</a>
);

export default Link;
