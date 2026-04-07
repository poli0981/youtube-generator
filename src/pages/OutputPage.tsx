import { OutputPreview } from "@components/output/OutputPreview";
import { CopyAllBar } from "@components/output/CopyAllBar";

export function OutputPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-4xl flex-1 p-6">
        <OutputPreview />
      </div>
      <CopyAllBar />
    </div>
  );
}
