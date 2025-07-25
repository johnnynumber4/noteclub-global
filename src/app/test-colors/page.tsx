import React from "react";

export default function TestColors() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Color Test Page</h1>

      {/* Test basic colors */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Basic Colors</h2>
        <div className="flex gap-4 mb-4">
          <div className="w-20 h-20 bg-purple-500 rounded"></div>
          <div className="w-20 h-20 bg-pink-500 rounded"></div>
          <div className="w-20 h-20 bg-blue-500 rounded"></div>
          <div className="w-20 h-20 bg-orange-500 rounded"></div>
        </div>
      </div>

      {/* Test gradients */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Gradients</h2>
        <div className="h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded mb-4"></div>
        <div className="h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded mb-4"></div>
        <div className="h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded"></div>
      </div>

      {/* Test text colors */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Text Colors</h2>
        <p className="text-purple-600 text-xl">Purple text</p>
        <p className="text-pink-600 text-xl">Pink text</p>
        <p className="text-blue-600 text-xl">Blue text</p>
        <p className="text-orange-600 text-xl">Orange text</p>
      </div>

      {/* Test gradient text */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Gradient Text</h2>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
          Gradient Text Test
        </h1>
      </div>

      {/* Test with inline styles as fallback */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Inline Style Test</h2>
        <div
          style={{
            background: "linear-gradient(to right, #9333ea, #ec4899)",
            height: "80px",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        ></div>
        <h1
          style={{
            background: "linear-gradient(to right, #9333ea, #ec4899, #f97316)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: "2rem",
            fontWeight: "bold",
          }}
        >
          Inline Gradient Text
        </h1>
      </div>
    </div>
  );
}
