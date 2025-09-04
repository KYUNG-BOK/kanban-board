import { Routes, Route, Navigate } from "react-router-dom";
import KanbanBoard from "./kanban/KanbanBoard";
import Navbar from "./Navbar"; // ⬅️ 추가

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar /> {/* ⬅️ 헤더 교체 */}

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/kanban" replace />} />
          <Route path="/kanban" element={<KanbanBoard />} />
          {/* <Route path="/stats" element={<StatsPage />} /> */}
          <Route path="*" element={<Navigate to="/kanban" replace />} />
        </Routes>
      </main>
    </div>
  );
}
