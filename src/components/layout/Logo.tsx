import Link from "next/link";
import Image from "next/image";
import localFont from "next/font/local";

// Font files can be colocated inside of `pages`
const logoFont = localFont({ src: "../../fonts/FZ-SG Galey/FZ-SG Galey.ttf" });

export const Logo = () => {
  return (
    <div className="">
      <Link href="/" className="flex items-center gap-2">
        <Image
          unoptimized
          src="/images/logo.svg"
          alt="Logo"
          width={45}
          height={45}
        />
        <div
          className={`text-black text-[22px] font-semibold ${logoFont.className} leading-tight`}
        >
          DIGITIZING
          <br />
          VIỆTNAM
        </div>
      </Link>
    </div>
  );
};

export default Logo;
