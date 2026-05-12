export default function MeshBackground({ light = false }) {
  return (
    <>
      <style>{`
        @keyframes meshBlob1 {
          0%,100% { transform: translate(0%,0%) scale(1); }
          33%      { transform: translate(12%,22%) scale(1.08); }
          66%      { transform: translate(-8%,12%) scale(0.94); }
        }
        @keyframes meshBlob2 {
          0%,100% { transform: translate(0%,0%) scale(1); }
          33%      { transform: translate(-18%,-12%) scale(1.06); }
          66%      { transform: translate(8%,-22%) scale(1.1); }
        }
        @keyframes meshBlob3 {
          0%,100% { transform: translate(0%,0%) scale(1); }
          33%      { transform: translate(8%,-8%) scale(0.92); }
          66%      { transform: translate(-12%,18%) scale(1.04); }
        }
        .mesh-b1 { animation: meshBlob1 24s ease-in-out infinite; }
        .mesh-b2 { animation: meshBlob2 30s ease-in-out infinite; }
        .mesh-b3 { animation: meshBlob3 20s ease-in-out infinite; }
      `}</style>
      <div className={`fixed inset-0 -z-10 overflow-hidden ${light ? 'bg-slate-50' : 'bg-[#04040a]'}`}>
        {light ? (
          <>
            <div className="mesh-b1 absolute -top-40 -left-32 w-[700px] h-[700px] rounded-full bg-violet-400/[0.10] blur-[130px] pointer-events-none" />
            <div className="mesh-b2 absolute top-10 right-[-15%] w-[550px] h-[550px] rounded-full bg-amber-400/[0.10] blur-[110px] pointer-events-none" />
            <div className="mesh-b3 absolute bottom-[-15%] left-[25%] w-[650px] h-[650px] rounded-full bg-sky-400/[0.10] blur-[130px] pointer-events-none" />
          </>
        ) : (
          <>
            <div className="mesh-b1 absolute -top-40 -left-32 w-[700px] h-[700px] rounded-full bg-violet-600/[0.11] blur-[130px] pointer-events-none" />
            <div className="mesh-b2 absolute top-10 right-[-15%] w-[550px] h-[550px] rounded-full bg-amber-500/[0.07] blur-[110px] pointer-events-none" />
            <div className="mesh-b3 absolute bottom-[-15%] left-[25%] w-[650px] h-[650px] rounded-full bg-sky-500/[0.07] blur-[130px] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.018]"
              style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '52px 52px' }} />
          </>
        )}
      </div>
    </>
  );
}
