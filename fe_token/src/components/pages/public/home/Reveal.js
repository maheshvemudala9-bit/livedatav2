import React from 'react';
import { useReveal } from './useHomeHooks';

const Reveal = ({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) => {
  const { ref, inView } = useReveal();
  return (
    <Tag
      ref={ref}
      className={`hp-reveal ${inView ? 'is-in' : ''} ${className}`.trim()}
      style={{ '--hp-delay': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
