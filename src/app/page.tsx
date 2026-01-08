import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const columns = [
    { title: "Requested", color: "border-blue-500" },
    { title: "In Progress", color: "border-yellow-500" },
    { title: "In Review", color: "border-purple-500" },
    { title: "Done", color: "border-green-500" },
  ];

  const tasks = [
    { id: 1, title: "Design homepage", column: 0 },
    { id: 2, title: "Fix login bug", column: 0 },
    { id: 3, title: "Add dark mode", column: 1 },
    { id: 4, title: "Implement API", column: 1 },
    { id: 5, title: "Write docs", column: 2 },
    { id: 6, title: "Deploy to prod", column: 3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">Kanban Board</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">{column.title}</h2>
              <p className="text-gray-500 text-sm">
                {tasks.filter(t => t.column === colIndex).length} tasks
              </p>
            </div>
            
            <div className="space-y-4">
              {tasks
                .filter(task => task.column === colIndex)
                .map(task => (
                  <Card key={task.id} className={`border-l-4 ${column.color}`}>
                    <CardContent className="p-4">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-gray-500 mt-1">Task #{task.id}</p>
                    </CardContent>
                  </Card>
                ))}
              
              {tasks.filter(t => t.column === colIndex).length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center text-gray-400">
                    No tasks
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}