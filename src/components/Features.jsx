import { useState, useRef } from "react";
import { TiLocationArrow } from "react-icons/ti";

export const BentoTilt = ({ children, className = "" }) => {
  const [transformStyle, setTransformStyle] = useState("");
  const itemRef = useRef(null);

  const handleMouseMove = (event) => {
    if (!itemRef.current) return;

    const { left, top, width, height } =
      itemRef.current.getBoundingClientRect();

    const relativeX = (event.clientX - left) / width;
    const relativeY = (event.clientY - top) / height;

    const tiltX = (relativeY - 0.5) * 5;
    const tiltY = (relativeX - 0.5) * -5;

    const newTransform = `perspective(700px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(.95, .95, .95)`;
    setTransformStyle(newTransform);
  };

  const handleMouseLeave = () => {
    setTransformStyle("");
  };

  return (
    <div
      ref={itemRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform: transformStyle }}
    >
      {children}
    </div>
  );
};

export const BentoCard = ({ src, title, description, isComingSoon, overlayClassName = "", mediaClassName = "" }) => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [hoverOpacity, setHoverOpacity] = useState(0);
  const hoverButtonRef = useRef(null);
  const isVideo = Boolean(src && src.match(/\.(mp4|webm|ogg)(\?.*)?$/i));

  const handleMouseMove = (event) => {
    if (!hoverButtonRef.current) return;
    const rect = hoverButtonRef.current.getBoundingClientRect();

    setCursorPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => setHoverOpacity(1);
  const handleMouseLeave = () => setHoverOpacity(0);

  return (
    <div className="relative size-full">
      {isVideo ? (
        <video
          src={src}
          loop
          muted
          autoPlay
          className={`absolute left-0 top-0 size-full object-cover object-center ${mediaClassName}`}
        />
      ) : (
        <img
          src={src}
          alt=""
          loading="lazy"
          className={`absolute left-0 top-0 size-full object-cover object-center ${mediaClassName}`}
        />
      )}
      {overlayClassName && (
        <div
          className={`pointer-events-none absolute inset-0 ${overlayClassName}`}
        />
      )}
      <div className="relative z-10 flex size-full flex-col justify-between p-5 text-blue-50">
        <div>
          <h1 className="bento-title special-font">{title}</h1>
          {description && (
            <p className="mt-3 max-w-64 text-xs md:text-base">{description}</p>
          )}
        </div>

        {isComingSoon && (
          <div
            ref={hoverButtonRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="border-hsla relative flex w-fit cursor-pointer items-center gap-1 overflow-hidden rounded-full bg-black px-5 py-2 text-xs uppercase text-white/20"
          >
            {/* Radial gradient hover effect */}
            <div
              className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
              style={{
                opacity: hoverOpacity,
                background: `radial-gradient(100px circle at ${cursorPosition.x}px ${cursorPosition.y}px, #656fe288, #00000026)`,
              }}
            />
            <TiLocationArrow className="relative z-20" />
            <p className="relative z-20">coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Features = () => (
  <section className="bg-black pb-52">
    <div className="container mx-auto px-3 md:px-10">
      <div className="px-5 py-32">
        <p className="font-circular-web text-lg text-blue-50">
          Into the Car
        </p>
        <p className="max-w-md font-circular-web text-lg text-blue-50 opacity-50">
          Immerse yourself in an experience you've never seen with a fresher, cooler look.
          ROG-G67 is proven to have 10⋅x more aura than a Lambrogini Urus.
        </p>
      </div>

      <BentoTilt className="border-hsla relative mb-7 h-96 w-full overflow-hidden rounded-md md:h-[65vh]">
        <BentoCard
          src="/img/feature-1.webp"
          overlayClassName="bg-black/50"
          title={
            <>
              R4-<b>MIN</b>IMA
            </>
          }
          description="The first UNO board featuring a 32-bit microcontroller and a clock speed of 48MhHz."
          isComingSoon
        />
      </BentoTilt>

      <div className="grid h-[135vh] w-full grid-cols-2 grid-rows-3 gap-7">
        <BentoTilt className="bento-tilt_1 row-span-1 md:col-span-1 md:row-span-2">
          <BentoCard
            src="/img/feature-2.webp"
            overlayClassName="bg-black/40"
            mediaClassName="object-[25%_center]"
            title={
              <>
                L-<b>298</b>N
              </>
            }
            description="Powers 2⋅X DC Motors with 18V. Powered to drive and carry objects."
            isComingSoon
          />
        </BentoTilt>

        <BentoTilt className="bento-tilt_1 row-span-1 ms-32 md:col-span-1 md:ms-0">
          <BentoCard
            src="/img/feature-3.webp"
            overlayClassName="bg-black/40"
            title={
              <>
                TCS-<b>3</b>200
              </>
            }
            description="An array of photodiodes with 4 different filters for RGB color sensing."
            isComingSoon
          />
        </BentoTilt>

        <BentoTilt className="bento-tilt_1 me-14 md:col-span-1 md:me-0">
          <BentoCard
            src="/img/feature-4.webp"
            overlayClassName="bg-black/50"
            title={
              <>
                ACTIVE-<b>I</b>R
              </>
            }
            description="Reflected energy emitted via infrared light sharpens G67's spatial awareness"
            isComingSoon
          />
        </BentoTilt>

        <BentoTilt className="bento-tilt_2">
          <div className="relative flex size-full flex-col justify-between overflow-hidden bg-violet-300 p-5">
            <img
              src="/img/car-3.webp"
              alt=""
              className="absolute inset-0 size-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/30" />
            <h1 className="bento-title special-font relative z-10 max-w-64 text-white">
              M<b>o</b>re co<b>m</b>ing s<b>o</b>on.
            </h1>

            <TiLocationArrow className="relative z-10 m-5 scale-[5] self-end text-white" />
          </div>
        </BentoTilt>

        <BentoTilt className="bento-tilt_1 row-span-1 ms-32 md:col-span-1 md:ms-0">
          <BentoCard
            src="videos/feature-5.mp4"
            overlayClassName="bg-black/40"
            title={
              <>
                HC-<b>SR</b>04
              </>
            }
            description="Transmits sound waves for efficient & long distance object detection."
          />
        </BentoTilt>
      </div>
    </div>
  </section>
);

export default Features;
