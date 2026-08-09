import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, HelpCircle, Clock, ShieldAlert, Award, ChevronLeft, ChevronRight, RotateCcw, Home, Flag, CheckCircle, AlertCircle, BookOpen, Layers } from 'lucide-react';

// Questions database
const PRACTICE_QUESTIONS = {
  frontend: [
    {
      id: 'f1',
      question: 'Which of the following is true about React Reconciliation?',
      option_a: 'It recreates the entire DOM on every state update.',
      option_b: 'It uses a diffing algorithm to update only changed components in the DOM.',
      option_c: 'It forces synchronous rendering for all event listeners.',
      option_d: 'It replaces Virtual DOM with shadow DOM directly.',
      correct_answer: 'B',
      marks: 100,
      explanation: 'Reconciliation is React\'s algorithm to diff the Virtual DOM tree with the actual DOM and update only the modified nodes, making UI updates fast and efficient.'
    },
    {
      id: 'f2',
      question: 'What is the purpose of the useEffect clean-up function?',
      option_a: 'To force re-render components on unmount.',
      option_b: 'To reset state values to their initial parameters.',
      option_c: 'To clear subscriptions, cancel timers, and avoid memory leaks before unmounting or re-running effects.',
      option_d: 'To validate props types before execution.',
      correct_answer: 'C',
      explanation: 'Returning a function from useEffect schedules a clean-up. This function runs before the effect re-runs or when the component unmounts, preventing memory leaks (e.g. clearing setIntervals).'
    },
    {
      id: 'f3',
      question: 'Which CSS property is used in flexbox to align items along the cross axis?',
      option_a: 'justify-content',
      option_b: 'align-items',
      option_c: 'flex-direction',
      option_d: 'align-content',
      correct_answer: 'B',
      explanation: 'While justify-content aligns items along the main axis, align-items specifies the default alignment for items along the cross axis inside a flex container.'
    },
    {
      id: 'f4',
      question: 'What is a closure in JavaScript?',
      option_a: 'A method used to seal objects and prevent modifications.',
      option_b: 'The process of terminating a running function execution.',
      option_c: 'A function bundled together with references to its surrounding state (lexical environment).',
      option_d: 'An event listener that automatically garbage collects scope.',
      correct_answer: 'C',
      explanation: 'A closure gives an inner function access to the outer function\'s scope even after the outer function has returned. It is created every time a function is created in JS.'
    },
    {
      id: 'f5',
      question: 'Which hook should be used to memoize the result of a resource-intensive calculation?',
      option_a: 'useEffect',
      option_b: 'useCallback',
      option_c: 'useMemo',
      option_d: 'useRef',
      correct_answer: 'C',
      explanation: 'useMemo memoizes a computed value and only recomputes it when its dependency array values change. useCallback is similar but memoizes the function reference itself.'
    }
  ],
  dsa: [
    {
      id: 'd1',
      question: 'What is the worst-case time complexity of searching in a Balanced Binary Search Tree (like an AVL or Red-Black Tree)?',
      option_a: 'O(1)',
      option_b: 'O(log N)',
      option_c: 'O(N)',
      option_d: 'O(N log N)',
      correct_answer: 'B',
      marks: 100,
      explanation: 'A balanced BST guarantees that its height is kept at logarithmic scale relative to node count N. Therefore, lookup, insertion, and deletion operations take O(log N) time.'
    },
    {
      id: 'd2',
      question: 'Which data structure follows the Last-In-First-Out (LIFO) order of operations?',
      option_a: 'Queue',
      option_b: 'Stack',
      option_c: 'Linked List',
      option_d: 'Priority Queue',
      correct_answer: 'B',
      explanation: 'A stack is a linear collection where elements are added (push) and removed (pop) from the same end, respecting the LIFO (Last-In-First-Out) principle.'
    },
    {
      id: 'd3',
      question: 'What algorithm is best suited to find the shortest path from a single source node to all other nodes in a graph with non-negative edge weights?',
      option_a: 'Kruskal\'s Algorithm',
      option_b: 'Dijkstra\'s Algorithm',
      option_c: 'Floyd-Warshall Algorithm',
      option_d: 'Depth First Search (DFS)',
      correct_answer: 'B',
      explanation: 'Dijkstra\'s algorithm is a greedy search algorithm that finds shortest paths in O(E + V log V) time. Kruskal\'s is for Minimum Spanning Tree, and Floyd-Warshall is for all-pairs shortest path.'
    },
    {
      id: 'd4',
      question: 'What is the time complexity of building a heap from an unsorted array of size N?',
      option_a: 'O(N log N)',
      option_b: 'O(N)',
      option_c: 'O(log N)',
      option_d: 'O(N^2)',
      correct_answer: 'B',
      explanation: 'Although inserting N elements into a heap one by one takes O(N log N), building a heap in-place using the Floyd bottom-up "heapify" method takes O(N) time complexity.'
    },
    {
      id: 'd5',
      question: 'Which traversal prints a Binary Search Tree in sorted ascending order?',
      option_a: 'Pre-order Traversal',
      option_b: 'Post-order Traversal',
      option_c: 'In-order Traversal',
      option_d: 'Level-order Traversal',
      correct_answer: 'C',
      explanation: 'In-order traversal visits the left subtree, the root, and then the right subtree. In a BST, this guarantees visiting values in ascending sorted sequence.'
    }
  ],
  cloud: [
    {
      id: 'c1',
      question: 'Which Azure service is best suited for hosting Docker containers serverless, without managing virtual machines?',
      option_a: 'Azure Virtual Machines',
      option_b: 'Azure Container Instances (ACI)',
      option_c: 'Azure App Service Plan (Basic)',
      option_d: 'Azure Disk Storage',
      correct_answer: 'B',
      marks: 100,
      explanation: 'Azure Container Instances (ACI) allows you to launch containers serverless in seconds, paying only for the CPU/Memory resources consumed, without setting up orchestrators or VM layers.'
    },
    {
      id: 'c2',
      question: 'What represents the core DevOps principle of treating infrastructure configurations as standard software source code?',
      option_a: 'Continuous Deployment (CD)',
      option_b: 'Infrastructure as Code (IaC)',
      option_c: 'Microservices Deployment',
      option_d: 'Automated Unit Testing',
      correct_answer: 'B',
      explanation: 'Infrastructure as Code (IaC) is the practice of provisioning and managing infrastructure using definition files (such as Terraform, ARM templates, or Ansible) rather than manual configs.'
    },
    {
      id: 'c3',
      question: 'In cloud computing, what does SaaS stand for?',
      option_a: 'Storage as a Service',
      option_b: 'Software as a Service',
      option_c: 'System as an Asset',
      option_d: 'Security as a Solution',
      correct_answer: 'B',
      explanation: 'SaaS stands for Software as a Service. It delivers end-user software applications over the internet (like Office 365, Slack) hosted and fully managed by the cloud provider.'
    },
    {
      id: 'c4',
      question: 'Which Azure Service provides a private, isolated network environment for your cloud resources?',
      option_a: 'Azure Traffic Manager',
      option_b: 'Azure Virtual Network (VNet)',
      option_c: 'Azure ExpressRoute',
      option_d: 'Azure Bastion Host',
      correct_answer: 'B',
      explanation: 'Azure Virtual Network (VNet) is the fundamental building block for your private network in Azure, enabling secure communication between Azure resources, internet, and on-premises networks.'
    },
    {
      id: 'c5',
      question: 'What cloud characteristic describes the ability to automatically provision or de-provision resources dynamically based on demand spikes?',
      option_a: 'High Availability',
      option_b: 'Elasticity',
      option_c: 'Fault Tolerance',
      option_d: 'Predictive Analytics',
      correct_answer: 'B',
      explanation: 'Elasticity is the cloud\'s ability to automatically scale resources in or out in response to real-time workload fluctuations. Scalability refers to capacity growth; elasticity is the dynamic automation of it.'
    }
  ],
  dbms: [
    {
      id: 'db1',
      question: 'Which SQL command is used to retrieve data from a relational database table?',
      option_a: 'UPDATE',
      option_b: 'SELECT',
      option_c: 'INSERT',
      option_d: 'DELETE',
      correct_answer: 'B',
      marks: 100,
      explanation: 'The SELECT statement is used in SQL to query data from database tables.'
    },
    {
      id: 'db2',
      question: 'In database normalisation, which Normal Form eliminates partial functional dependencies on a composite primary key?',
      option_a: '1NF (First Normal Form)',
      option_b: '2NF (Second Normal Form)',
      option_c: '3NF (Third Normal Form)',
      option_d: 'BCNF (Boyce-Codd Normal Form)',
      correct_answer: 'B',
      marks: 100,
      explanation: 'Second Normal Form (2NF) requires 1NF and additionally demands that all non-key attributes are fully functionally dependent on the entire primary key.'
    },
    {
      id: 'db3',
      question: 'Which ACID property guarantees that once a transaction completes successfully, its changes are permanently stored in non-volatile memory?',
      option_a: 'Atomicity',
      option_b: 'Consistency',
      option_c: 'Isolation',
      option_d: 'Durability',
      correct_answer: 'D',
      marks: 100,
      explanation: 'Durability guarantees that committed transactions persist permanently even in case of system failure or power loss.'
    },
    {
      id: 'db4',
      question: 'Which type of SQL JOIN returns all records from the left table and matching records from the right table?',
      option_a: 'INNER JOIN',
      option_b: 'LEFT (OUTER) JOIN',
      option_c: 'RIGHT (OUTER) JOIN',
      option_d: 'FULL (OUTER) JOIN',
      correct_answer: 'B',
      marks: 100,
      explanation: 'A LEFT JOIN returns all rows from the left table, with NULLs for unmatched rows from the right table.'
    },
    {
      id: 'db5',
      question: 'What is the primary data structure commonly used by relational database systems for table indexing?',
      option_a: 'Binary Search Tree',
      option_b: 'B-Tree / B+ Tree',
      option_c: 'Linked List',
      option_d: 'Min-Heap',
      correct_answer: 'B',
      marks: 100,
      explanation: 'B-Trees and B+ Trees keep data sorted and allow search, sequential access, insertions, and deletions in logarithmic O(log N) time.'
    },
    {
      id: 'db6',
      question: 'Which relational algebra operation selects rows that satisfy a specified condition (predicate)?',
      option_a: 'Projection (π)',
      option_b: 'Selection (σ)',
      option_c: 'Cartesian Product (×)',
      option_d: 'Union (∪)',
      correct_answer: 'B',
      marks: 100,
      explanation: 'Selection (denoted by sigma σ) filters rows/tuples meeting a predicate condition, whereas Projection (pi π) filters columns.'
    },
    {
      id: 'db7',
      question: 'What type of dependency occurs when attribute A determines attribute B, and B determines attribute C (A -> B and B -> C)?',
      option_a: 'Partial Dependency',
      option_b: 'Transitive Dependency',
      option_c: 'Trivial Dependency',
      option_d: 'Multivalued Dependency',
      correct_answer: 'B',
      marks: 100,
      explanation: 'A transitive dependency exists when a non-prime attribute depends on another non-prime attribute. 3NF eliminates transitive dependencies.'
    },
    {
      id: 'db8',
      question: 'Which concurrency control protocol ensures serializability by dividing locking into a Growing phase and a Shrinking phase?',
      option_a: 'Time-stamp Ordering Protocol',
      option_b: 'Two-Phase Locking (2PL) Protocol',
      option_c: 'Graph-based Locking',
      option_d: 'Validation-based Protocol',
      correct_answer: 'B',
      marks: 100,
      explanation: 'Two-Phase Locking (2PL) consists of a growing phase (acquiring locks) and a shrinking phase (releasing locks) to guarantee serializability.'
    },
    {
      id: 'db9',
      question: 'What constraint enforces referential integrity between two tables in a relational database?',
      option_a: 'Primary Key',
      option_b: 'Foreign Key',
      option_c: 'Unique Key',
      option_d: 'Check Constraint',
      correct_answer: 'B',
      marks: 100,
      explanation: 'A Foreign Key links a field in one table to the Primary Key of another table, enforcing referential integrity.'
    },
    {
      id: 'db10',
      question: 'In SQL, which clause is used to filter group aggregations produced by a GROUP BY clause?',
      option_a: 'WHERE',
      option_b: 'HAVING',
      option_c: 'ORDER BY',
      option_d: 'LIMIT',
      correct_answer: 'B',
      marks: 100,
      explanation: 'The HAVING clause filters rows after aggregate operations are performed by GROUP BY, whereas WHERE filters individual rows before grouping.'
    }
  ]
};

const CATEGORY_META = {
  dbms: {
    title: 'Database Management Systems (DBMS)',
    desc: 'Master SQL queries, Normalization (1NF to BCNF), ACID transaction properties, Indexing B-Trees, Relational Algebra, and Concurrency 2PL protocols.',
    themeColor: 'from-amber-500 to-orange-500',
    hoverBorder: 'hover:border-amber-400',
    pillBg: 'bg-amber-50 text-amber-700',
    iconColor: 'text-amber-600 bg-amber-50'
  },
  frontend: {
    title: 'Frontend Mastery',
    desc: 'Test your understanding of JavaScript closures, React reconciliation algorithms, hooks lifecycle, and responsive CSS architectures.',
    themeColor: 'from-blue-500 to-cyan-500',
    hoverBorder: 'hover:border-blue-400',
    pillBg: 'bg-blue-50 text-blue-700',
    iconColor: 'text-blue-600 bg-blue-50'
  },
  dsa: {
    title: 'Algorithms & Data Structures',
    desc: 'Solve complexities regarding balanced BST, stacks/queues LIFO principles, Dijkstra shortest paths, heaps, and binary tree traversals.',
    themeColor: 'from-emerald-500 to-teal-500',
    hoverBorder: 'hover:border-emerald-400',
    pillBg: 'bg-emerald-50 text-emerald-700',
    iconColor: 'text-emerald-600 bg-emerald-50'
  },
  cloud: {
    title: 'Cloud & DevOps Essentials',
    desc: 'Verify cloud serverless containerization (ACI), Infrastructure as Code (IaC), SaaS/PaaS models, Virtual Networks, and elasticity behaviors.',
    themeColor: 'from-purple-500 to-indigo-500',
    hoverBorder: 'hover:border-purple-400',
    pillBg: 'bg-purple-50 text-purple-700',
    iconColor: 'text-purple-600 bg-purple-50'
  }
};

export default function PracticeQuiz() {
  const { category } = useParams();
  const navigate = useNavigate();

  // Active state control
  const [inQuiz, setInQuiz] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionIdx]: selectedOption }
  const [flags, setFlags] = useState({}); // { [questionIdx]: isFlagged }
  const [timer, setTimer] = useState(120); // 2 minutes
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);

  const timerIntervalRef = useRef(null);
  const questions = PRACTICE_QUESTIONS[category] || [];
  const meta = CATEGORY_META[category];

  // Timer effect
  useEffect(() => {
    if (inQuiz && !completed) {
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            handleSubmitTest();
            return 0;
          }
          setTimeSpent((t) => t + 1);
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [inQuiz, completed]);

  const handleStartQuiz = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setAnswers({});
    setFlags({});
    setTimer(120);
    setTimeSpent(0);
    setCurrentIdx(0);
    setCompleted(false);
    setInQuiz(true);
  };

  const handleSelectOption = (optionKey) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIdx]: optionKey
    }));
  };

  const toggleFlag = () => {
    setFlags((prev) => ({
      ...prev,
      [currentIdx]: !prev[currentIdx]
    }));
  };

  const handleSubmitTest = () => {
    setCompleted(true);
    setInQuiz(false);
    setShowSubmitModal(false);
    clearInterval(timerIntervalRef.current);
  };

  // Score calculation
  const getScoreStats = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correct_answer) {
        correct++;
      }
    });
    const total = questions.length;
    const score = correct * 20; // 20 points per question
    const percentage = Math.round((correct / total) * 100);
    return { correct, wrong: total - correct, score, percentage, total };
  };

  const stats = completed ? getScoreStats() : null;

  // Render Arena Selection Page if no category is in URL, or invalid category
  if (!category || !PRACTICE_QUESTIONS[category]) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-lightBlue/20 via-zinc-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              Self-Paced Training
            </span>
            <h1 className="text-4xl font-extrabold text-brand-textMain tracking-tight leading-none">
              Practice Arena
            </h1>
            <p className="text-zinc-550 text-base max-w-lg mx-auto leading-relaxed">
              Sharpen your tech skills. Select a category below to test your knowledge independently. No codes or host triggers required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(CATEGORY_META).map(([key, value]) => (
              <div
                key={key}
                className={`bg-white border border-brand-border ${value.hoverBorder} rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between text-left group`}
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${value.iconColor}`}>
                    {key === 'frontend' && <BookOpen size={22} />}
                    {key === 'dsa' && <Trophy size={22} />}
                    {key === 'cloud' && <Layers size={22} />}
                  </div>
                  
                  <div className="space-y-1.5">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${value.pillBg}`}>
                      5 Questions â€¢ 2 Mins
                    </span>
                    <h3 className="text-lg font-bold text-brand-textMain">{value.title}</h3>
                  </div>
                  
                  <p className="text-xs text-brand-textMuted leading-relaxed">
                    {value.desc}
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/practice/${key}`)}
                  className={`mt-8 w-full text-center bg-gradient-to-r ${value.themeColor} text-white font-bold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-md active:scale-98`}
                >
                  <span>Start Practice Quiz</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-150 pt-8 flex items-center justify-center space-x-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-brand-textMuted hover:text-brand-textMain text-xs font-semibold transition-all"
            >
              <Home size={14} />
              <span>Back to Home</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Render Completed Scorecard
  if (completed && stats) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-lightBlue/20 via-zinc-50 to-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
          
          {/* Header Card */}
          <div className="bg-white border border-brand-border p-8 rounded-2xl shadow-xl relative overflow-hidden text-center space-y-6">
            <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${meta.themeColor}`}></div>
            
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-brand-textMuted uppercase tracking-wider">Quiz Completed</span>
              <h2 className="text-3xl font-extrabold text-zinc-850 tracking-tight">{meta.title}</h2>
              <p className="text-brand-textMuted text-xs font-medium">Self-Paced Performance Review</p>
            </div>

            {/* Performance Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-xl mx-auto pt-2">
              
              {/* Radial Accuracy Ring */}
              <div className="bg-brand-bgLight p-4 rounded-xl border border-zinc-100 flex flex-col items-center justify-center space-y-2">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-zinc-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={stats.percentage >= 60 ? 'text-emerald-500' : 'text-amber-500'}
                      strokeDasharray={`${stats.percentage}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-extrabold text-lg text-brand-textMain">
                    {stats.percentage}%
                  </div>
                </div>
                <span className="text-[10px] font-bold text-brand-textMuted uppercase tracking-widest">Accuracy</span>
              </div>

              {/* Score card */}
              <div className="bg-brand-bgLight p-4 rounded-xl border border-zinc-100 flex flex-col items-center justify-center space-y-1">
                <Award size={28} className="text-brand-blue mb-1" />
                <h3 className="text-2xl font-extrabold text-brand-textMain">{stats.score}</h3>
                <span className="text-[10px] font-bold text-brand-textMuted uppercase tracking-widest">Total Points</span>
              </div>

              {/* Time Spent card */}
              <div className="bg-brand-bgLight p-4 rounded-xl border border-zinc-100 flex flex-col items-center justify-center space-y-1">
                <Clock size={28} className="text-brand-textMuted mb-1" />
                <h3 className="text-2xl font-extrabold text-brand-textMain">{Math.floor(timeSpent / 60)}m {timeSpent % 60}s</h3>
                <span className="text-[10px] font-bold text-brand-textMuted uppercase tracking-widest">Time Spent</span>
              </div>

            </div>

            {/* Quick Actions */}
            <div className="flex justify-center space-x-4 border-t border-zinc-100 pt-6">
              <button
                onClick={handleStartQuiz}
                className="flex items-center space-x-2 border border-brand-border hover:border-zinc-350 hover:bg-brand-bgLight text-zinc-655 font-bold px-5 py-2.5 rounded-lg text-xs transition-all cursor-pointer shadow-sm"
              >
                <RotateCcw size={14} />
                <span>Retake Quiz</span>
              </button>
              <button
                onClick={() => navigate('/practice')}
                className="flex items-center space-x-2 bg-zinc-900 hover:bg-zinc-850 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all cursor-pointer shadow-md"
              >
                <span>Back to Arena</span>
              </button>
            </div>

          </div>

          {/* Detailed Question Review Scorecard */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-850">Review Question Details</h3>
            
            {questions.map((q, idx) => {
              const selectedOpt = answers[idx];
              const isCorrect = selectedOpt === q.correct_answer;
              
              return (
                <div key={q.id} className="bg-white border border-brand-border p-6 rounded-xl shadow-sm space-y-4 text-left">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brand-textMuted font-bold uppercase tracking-wider">Question {idx + 1}</span>
                    <span className={`font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
                      isCorrect 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {isCorrect ? <CheckCircle size={12} className="mr-1" /> : <AlertCircle size={12} className="mr-1" />}
                      <span>{isCorrect ? 'Correct (+20 pts)' : 'Incorrect (+0 pts)'}</span>
                    </span>
                  </div>

                  <h4 className="text-md font-bold text-brand-textMain leading-tight">
                    {q.question}
                  </h4>

                  {/* Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {[
                      { k: 'A', text: q.option_a },
                      { k: 'B', text: q.option_b },
                      { k: 'C', text: q.option_c },
                      { k: 'D', text: q.option_d }
                    ].map((opt) => {
                      const isSelected = selectedOpt === opt.k;
                      const isCorrectOpt = q.correct_answer === opt.k;
                      
                      let optionBorder = 'border-brand-border';
                      let optionBg = 'bg-brand-bgLight/20';
                      let labelBg = 'bg-zinc-100 text-zinc-650';

                      if (isCorrectOpt) {
                        optionBorder = 'border-emerald-500/30';
                        optionBg = 'bg-emerald-50/30';
                        labelBg = 'bg-emerald-500 text-white';
                      } else if (isSelected && !isCorrectOpt) {
                        optionBorder = 'border-red-500/30';
                        optionBg = 'bg-red-50/30';
                        labelBg = 'bg-red-500 text-white';
                      }

                      return (
                        <div
                          key={opt.k}
                          className={`border p-3.5 rounded-lg flex items-center space-x-3 ${optionBorder} ${optionBg}`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${labelBg}`}>
                            {opt.k}
                          </div>
                          <span className="font-semibold text-zinc-700">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation card */}
                  <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 text-blue-800 font-bold">
                      <HelpCircle size={14} />
                      <span>Explanation Overview:</span>
                    </div>
                    <p className="text-zinc-600 leading-relaxed font-medium">
                      {q.explanation || 'No detailed explanation provided.'}
                    </p>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </div>
    );
  }

  // Render Active Quiz Mode
  if (inQuiz) {
    const currentQ = questions[currentIdx];
    const isSelected = (opt) => answers[currentIdx] === opt;
    const isFlagged = flags[currentIdx];
    const totalQ = questions.length;

    return (
      <div className="min-h-[calc(100vh-4rem)] bg-brand-bgLight py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left / Top: Floating Tracker Sidebar */}
          <div className="lg:col-span-3 bg-white border border-brand-border p-5 rounded-2xl shadow-sm space-y-4">
            <div className="space-y-1 border-b border-zinc-100 pb-3">
              <span className="text-[10px] font-bold text-brand-textMuted uppercase tracking-widest">{meta.title}</span>
              <h3 className="text-md font-bold text-brand-textMain">Test Dashboard</h3>
            </div>

            {/* Questions Grid Tracker */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-brand-textMuted uppercase tracking-widest">Question Navigation</p>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, idx) => {
                  let cellBg = 'bg-brand-bgLight border-brand-border text-brand-textMuted';
                  if (currentIdx === idx) {
                    cellBg = 'bg-zinc-900 border-zinc-900 text-white font-bold ring-2 ring-zinc-500/20';
                  } else if (flags[idx]) {
                    cellBg = 'bg-amber-500 border-amber-500 text-white font-bold';
                  } else if (answers[idx] !== undefined) {
                    cellBg = 'bg-brand-blue border-brand-blue text-white font-bold';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentIdx(idx)}
                      className={`w-full aspect-square border rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer hover:brightness-105`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color keys legend */}
            <div className="text-[10px] space-y-1.5 border-t border-zinc-100 pt-3.5">
              <div className="flex items-center space-x-2 text-brand-textMuted font-semibold">
                <span className="w-2.5 h-2.5 rounded bg-zinc-100 border border-zinc-250 inline-block"></span>
                <span>Unvisited / Unanswered</span>
              </div>
              <div className="flex items-center space-x-2 text-brand-textMuted font-semibold">
                <span className="w-2.5 h-2.5 rounded bg-brand-blue inline-block"></span>
                <span>Answered option</span>
              </div>
              <div className="flex items-center space-x-2 text-brand-textMuted font-semibold">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span>
                <span>Flagged for review</span>
              </div>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full bg-red-655 hover:bg-red-700 bg-red-600 text-white font-bold py-3 rounded-lg text-xs transition-all shadow-md mt-4 cursor-pointer active:scale-98"
            >
              Submit Test Paper
            </button>
          </div>

          {/* Right / Bottom: Active Question Card */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Header / Timer Panel */}
            <div className="flex justify-between items-center bg-white border border-brand-border px-6 py-4 rounded-xl shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-brand-textMuted uppercase tracking-widest">In Progress</span>
                <h4 className="text-md font-bold text-brand-textMain">{meta.title}</h4>
              </div>

              {/* Progress timer */}
              <div className="flex items-center space-x-2 bg-amber-50 border border-amber-100 text-amber-800 px-4 py-2 rounded-lg font-bold">
                <Clock size={16} className="text-amber-600 animate-pulse" />
                <span className="text-sm font-bold">
                  {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Question detail */}
            <div className="bg-white border border-brand-border p-8 rounded-2xl shadow-sm space-y-6 text-left relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${meta.themeColor}`}></div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-brand-textMuted uppercase tracking-widest">Question {currentIdx + 1} of {totalQ}</span>
                <button
                  onClick={toggleFlag}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    isFlagged 
                      ? 'bg-amber-50 border-amber-200 text-amber-700' 
                      : 'bg-white border-brand-border hover:bg-brand-bgLight text-brand-textMuted'
                  }`}
                >
                  <Flag size={12} fill={isFlagged ? 'currentColor' : 'none'} />
                  <span>{isFlagged ? 'Flagged for review' : 'Flag Question'}</span>
                </button>
              </div>

              <h2 className="text-xl font-extrabold text-zinc-850 leading-tight">
                {currentQ.question}
              </h2>

              {/* Options */}
              <div className="grid grid-cols-1 gap-4 pt-2">
                {[
                  { k: 'A', text: currentQ.option_a },
                  { k: 'B', text: currentQ.option_b },
                  { k: 'C', text: currentQ.option_c },
                  { k: 'D', text: currentQ.option_d }
                ].map((opt) => {
                  const selected = isSelected(opt.k);
                  
                  return (
                    <button
                      key={opt.k}
                      onClick={() => handleSelectOption(opt.k)}
                      className={`w-full text-left p-5 rounded-xl border transition-all relative flex items-center space-x-4 cursor-pointer ${
                        selected 
                          ? 'bg-brand-lightBlue border-brand-blue text-brand-dark ring-2 ring-brand-blue/20' 
                          : 'bg-white border-brand-border hover:border-brand-blue/40 hover:bg-brand-bgLight/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        selected ? 'bg-brand-blue text-white' : 'bg-zinc-100 text-zinc-700'
                      }`}>
                        {opt.k}
                      </div>
                      <span className="font-semibold text-brand-textMain text-base">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="flex items-center space-x-1.5 border border-brand-border disabled:opacity-40 hover:bg-brand-bgLight disabled:hover:bg-white text-zinc-600 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <ChevronLeft size={16} />
                <span>Previous Question</span>
              </button>
              
              <button
                onClick={() => setCurrentIdx((prev) => Math.min(totalQ - 1, prev + 1))}
                disabled={currentIdx === totalQ - 1}
                className="flex items-center space-x-1.5 border border-brand-border disabled:opacity-40 hover:bg-brand-bgLight disabled:hover:bg-white text-zinc-600 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <span>Next Question</span>
                <ChevronRight size={16} />
              </button>
            </div>

          </div>

        </div>

        {/* Submit review modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-zinc-950/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-zinc-100 text-center space-y-6 animate-fade-in animate-scale-up">
              
              <div className="w-12 h-12 bg-red-50 text-red-655 rounded-full flex items-center justify-center mx-auto text-red-600">
                <ShieldAlert size={26} />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-zinc-850">Submit Quiz Paper?</h3>
                <p className="text-xs text-brand-textMuted">
                  You have answered {Object.keys(answers).length} out of {totalQ} questions. 
                  {Object.values(flags).filter(Boolean).length > 0 && ` (${Object.values(flags).filter(Boolean).length} questions are flagged for review).`}
                </p>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-grow border border-brand-border hover:bg-brand-bgLight text-brand-textMuted font-semibold py-2.5 rounded-lg text-xs transition-all cursor-pointer"
                >
                  Cancel & Review
                </button>
                <button
                  onClick={handleSubmitTest}
                  className="flex-grow bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-2.5 rounded-lg text-xs transition-all cursor-pointer shadow-md"
                >
                  Yes, Submit Quiz
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    );
  }

  // Render Categories Landing Page for the selected category (Metadata check)
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-lightBlue/20 via-zinc-50 to-white">
      <div className="max-w-md w-full bg-white border border-brand-border p-8 rounded-2xl shadow-xl space-y-6 relative overflow-hidden group animate-fade-in">
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${meta.themeColor}`}></div>

        <div className="text-center space-y-4">
          <span className="text-[10px] font-bold text-brand-textMuted uppercase tracking-widest">Ready to Start?</span>
          <h2 className="text-2xl font-extrabold text-zinc-850 tracking-tight">{meta.title}</h2>
          <p className="text-xs text-zinc-550 leading-relaxed">
            {meta.desc}
          </p>
        </div>

        <div className="bg-brand-bgLight p-4 rounded-xl border border-zinc-100 flex justify-around text-center text-xs">
          <div>
            <span className="block text-[10px] font-bold text-brand-textMuted uppercase tracking-wider">Questions</span>
            <span className="block font-bold text-brand-textMain mt-1 text-sm">5 Items</span>
          </div>
          <div className="w-px bg-zinc-200"></div>
          <div>
            <span className="block text-[10px] font-bold text-brand-textMuted uppercase tracking-wider">Duration</span>
            <span className="block font-bold text-brand-textMain mt-1 text-sm">2 Minutes</span>
          </div>
          <div className="w-px bg-zinc-200"></div>
          <div>
            <span className="block text-[10px] font-bold text-brand-textMuted uppercase tracking-wider">Speed Scoring</span>
            <span className="block font-bold text-brand-textMain mt-1 text-sm">Disabled</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={handleStartQuiz}
            className={`w-full bg-gradient-to-r ${meta.themeColor} text-white font-bold py-3.5 rounded-lg text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-md active:scale-98`}
          >
            <span>Start Practice Exam</span>
            <ChevronRight size={14} />
          </button>
          
          <button
            onClick={() => navigate('/practice')}
            className="w-full text-center border border-brand-border hover:bg-brand-bgLight text-brand-textMuted font-semibold py-2.5 rounded-lg text-xs transition-all cursor-pointer"
          >
            Go Back
          </button>
        </div>

      </div>
    </div>
  );
}
