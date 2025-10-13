import React from 'react';

const Logo = ({ invert }: { invert?: boolean }) => {
  return (
    <div className="flex items-center gap-3">
      <svg width="50" height="50" viewBox="0 0 540 540" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0_2247_294)">
          <path d="M47 336.749L272.132 177.249L498.499 334.75L272.132 494.249L47 336.749Z" fill={!invert ? "#D2D2D2" : "#636363"} />
          <path d="M41 204.749L266.132 45.2493L492.499 202.75L266.132 362.249L41 204.749Z" fill={!invert ? "#5C5C5C" : "#E2E2E2"} />
          <path d="M42 268.749L267.132 109.249L493.499 266.75L267.132 426.249L42 268.749Z" fill={!invert ? "#585858" : "#AFAFAF"} fill-opacity="0.7" />
        </g>
        <defs>
          <clipPath id="clip0_2247_294">
            <rect width="540" height="540" fill="white" />
          </clipPath>
        </defs>
      </svg>



        <h1 className={`md:text-3xl text-2xl font-bold ${invert ? 'text-white' : 'text-black'}`}>
          Gridix
        </h1>
    </div>
  );
};

export default Logo;