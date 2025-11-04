const StudyPage = () => {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Study</h1>
      </div>
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-semibold mb-4">Study Mode</h2>
        <p className="text-muted-foreground mb-8">
          Practice and learn with interactive study sessions.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Flashcards</h3>
            <p className="text-sm text-muted-foreground">
              Review vocabulary with spaced repetition.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Quizzes</h3>
            <p className="text-sm text-muted-foreground">
              Test your knowledge with multiple choice questions.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Practice Tests</h3>
            <p className="text-sm text-muted-foreground">
              Simulate real exam conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyPage;
