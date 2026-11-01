import { MeshSubnav } from "@/components/mesh/mesh-subnav";

export default function MeshLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MeshSubnav />
      {children}
    </>
  );
}
