import React, { useState } from "react";
import ChartPanel from "@/components/ChartPanel";

const Charts: React.FC = () => {
  const [mode, setMode] = useState<"single" | "double">("single");

  return (
    <div className="h-screen flex flex-col">
      <div className="p-2 border-b flex gap-2">
        <button
          onClick={() => setMode("single")}
          className="px-3 py-1 border rounded"
        >
          Single
        </button>

        <button
          onClick={() => setMode("double")}
          className="px-3 py-1 border rounded"
        >
          Double
        </button>
      </div>

      <div className="flex-1 flex">
        {mode === "single" && (
          <div className="flex-1 h-full">
            <ChartPanel />
          </div>
        )}

        {mode === "double" && (
          <>
            <div className="flex-1 h-full border-r relative">
              <ChartPanel />
              {/* vertical divider */}
              <div className="absolute top-0 right-0 w-[2px] h-full bg-gray-400" />
            </div>

            <div className="flex-1 h-full">
              <ChartPanel />
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default Charts;