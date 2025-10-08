"use client";
import React, { useState } from "react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";

const texts = [
  { id: "q1", text: "Entdecken Sie interessante Städte und Regionen..." },
  { id: "q2", text: "Jugendliche arbeiten für Jugendliche..." },
  { id: "q3", text: "Die Windjacken waren schon eingepackt..." }
];

const options = [
  { id: "A", title: "Am Strand im Dienst – mehr Sicherheit für Urlauber" },
  { id: "B", title: "Bäder, Seen und Natur – im hessischen Paradies" },
  { id: "C", title: "Freiheit und Natur – nach sechs Wochen harter Arbeit" },
  { id: "D", title: "Jugendliche arbeiten für Jugendliche" },
  { id: "E", title: "Kinderarbeit in Deutschland: Jugendliche werden zur Arbeit gezwungen" },
  { id: "F", title: "Nach harter Arbeit durch nordische Gewässer" },
  { id: "G", title: "Schaden an Kreuzfahrtschiff verhindert Weiterfahrt" },
  { id: "H", title: "Urlaub an deutschen Seen immer gefährlicher" },
  { id: "I", title: "Wegen Niedrigwasser: vom Fluss auf die Straße" },
  { id: "J", title: "Zu Gast bei den Fürsten" }
];

// ✅ Draggable Option Item
function DraggableItem({ option, disabled, onClick }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: option.id,
    disabled
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!disabled ? listeners : {})}
      {...attributes}
      onClick={() => !disabled && onClick(option.id)}
      className={`p-2 border rounded shadow select-none
        ${disabled ? "bg-gray-400 text-white cursor-not-allowed" : "bg-white cursor-pointer hover:bg-blue-100"}`}
    >
      {option.id}: {option.title}
    </div>
  );
}

// ✅ Droppable Question Box
function DroppableBox({ id, children, active, onClick }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      onClick={() => onClick(id)}
      className={`p-4 min-h-[120px] border rounded cursor-pointer 
        ${isOver ? "bg-blue-100" : "bg-white"} 
        ${active ? "border-4 border-blue-500" : ""}`}
    >
      {children}
    </div>
  );
}

export default function LevelOne() {
  const [answers, setAnswers] = useState({});
  const [activeQ, setActiveQ] = useState(null);

  // ✅ Handle drag and drop
  const handleDragEnd = (event) => {
    const { over, active } = event;
    if (over && over.id.startsWith("q")) {
      const qId = over.id;
      setAnswers((prev) => ({ ...prev, [qId]: active.id }));
    }
  };

  // ✅ Handle click option
  const handleOptionClick = (optId) => {
    if (activeQ) {
      setAnswers((prev) => ({ ...prev, [activeQ]: optId }));
      //   setActiveQ(null); // reset after assign
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-2 gap-6 p-6 bg-gray-100 min-h-screen">
        {/* LEFT: Questions */}
        <div className="space-y-6">
          {texts.map((q) => (
            <DroppableBox
              key={q.id}
              id={q.id}
              active={activeQ === q.id}
              onClick={(id) => setActiveQ(id)}
            >
              <h3 className="font-bold mb-2">{q.text.slice(0, 50)}...</h3>
              {answers[q.id] ? (
                <div className="p-2 border rounded bg-green-200">
                  {answers[q.id]}:{" "}
                  {options.find((o) => o.id === answers[q.id])?.title}
                </div>
              ) : (
                <p className="text-gray-400">
                  {activeQ === q.id ? "Klicken Sie auf eine Antwort..." : "Drop/Click answer here"}
                </p>
              )}
            </DroppableBox>
          ))}
        </div>

        {/* RIGHT: Answer Pool */}
        <div>
          <h3 className="font-bold mb-2">Antworten</h3>
          <div className="space-y-2">
            {options.map((o) => (
              <DraggableItem
                key={o.id}
                option={o}
                disabled={Object.values(answers).includes(o.id)} // disable once used
                onClick={handleOptionClick}
              />
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  );
}
