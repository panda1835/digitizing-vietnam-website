import Image from "next/image";

const LoadingSpinner = ({ size = 100 }) => {
  return (
    <div className="relative inline-block">
      {/* Logo */}
      <Image
        unoptimized
        src="/images/logo.svg"
        alt="Logo"
        width={45}
        height={45}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      />

      {/* Spinner */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin"
      >
        <path
          d="M16 2C8.26801 2 2 8.26801 2 16C2 23.732 8.26801 30 16 30C23.732 30 30 23.732 30 16C30 8.26801 23.732 2 16 2ZM16 4C22.6274 4 28 9.37258 28 16C28 22.6274 22.6274 28 16 28C9.37258 28 4 22.6274 4 16C4 9.37258 9.37258 4 16 4Z"
          fill="#a5701c"
          fillOpacity="0.2"
        />
        <path
          d="M16 2C8.26801 2 2 8.26801 2 16C2 19.7255 3.46697 23.1308 5.85786 25.6569"
          stroke="#a5701c"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default LoadingSpinner;
