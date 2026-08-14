import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import {
  Calendar, ArrowLeft, ArrowRight, Plus, Trash2, Upload, FileSpreadsheet, FileText,
  CheckCircle, AlertTriangle, Clock, ShieldCheck, HelpCircle, Layers, CheckSquare, Sparkles, RefreshCw, QrCode, Mail, Award, ExternalLink, Download, Search, ChevronDown, Check
} from 'lucide-react';

export default function CreateScheduledQuiz() {
  const navigate = useNavigate();
  const { id } = useParams(); // If present, mode is EDIT

  const isEditMode = Boolean(id);

  const [activeTab, setActiveTab] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(isEditMode);
  const [errorMessage, setErrorMessage] = useState('');
  const [timeFormat12, setTimeFormat12] = useState(true);
  const [availableBadges, setAvailableBadges] = useState([]);
  const [loadingBadges, setLoadingBadges] = useState(false);

  // Category Search & Create State
  const DEFAULT_CATEGORIES = [
    'Cloud & Azure',
    'Database Management (DBMS)',
    'Data Structures & Algorithms (DSA)',
    'DevOps & CI/CD',
    'Web Development',
    'Artificial Intelligence & ML',
    'Cybersecurity',
    'Programming Languages',
    'General CS'
  ];
  const [categoriesList, setCategoriesList] = useState(DEFAULT_CATEGORIES);
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  // Occurrence Sections State
  const [customSections, setCustomSections] = useState({});
  const [activeSectionFilter, setActiveSectionFilter] = useState(0); // 0 = All Sections

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchExistingCategories = async () => {
      try {
        const res = await api.get('/api/quizzes');
        const existing = (res.data || [])
          .map(q => q.subject)
          .filter(Boolean);
        if (existing.length > 0) {
          setCategoriesList(prev => Array.from(new Set([...prev, ...existing])));
        }
      } catch (e) {
        // fallback
      }
    };
    fetchExistingCategories();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const now = new Date();
  const currentHour = now.getHours();
  const currentAmpm = currentHour >= 12 ? 'PM' : 'AM';
  const startHh = String((currentHour % 12) || 12).padStart(2, '0');
  const endHour = (currentHour + 2) % 24;
  const endAmpm = endHour >= 12 ? 'PM' : 'AM';
  const endHh = String((endHour % 12) || 12).padStart(2, '0');

  const [formData, setFormData] = useState({
    title: '',
    custom_slug: '',
    description: '',
    category: 'Cloud & Azure',
    difficulty: 'Intermediate',
    instructions: 'Complete all questions within the allocated time window.',
    schedule_type: 'ONE_TIME',
    start_date: today,
    end_date: today,
    
    // Time with seconds & AM/PM
    start_time_hh: startHh,
    start_time_mm: '00',
    start_time_ss: '00',
    start_time_ampm: currentAmpm,

    end_time_hh: endHh,
    end_time_mm: '00',
    end_time_ss: '00',
    end_time_ampm: endAmpm,

    timezone: 'Asia/Kolkata',

    // Granular Recurrence Settings
    days_of_week: ['MON'],
    weeks_pattern: '1_3',
    day_of_month: 1,
    custom_interval_days: 3,

    // Quiz Rules & Proctoring
    time_limit: 30,
    max_attempts: 1,
    score_policy: 'BEST',
    shuffle_questions: true,
    shuffle_answers: true,
    require_fullscreen: false,
    anti_cheat_enabled: true,
    max_violations: 3,
    positive_marks: 1,
    negative_marks: 0,
    show_leaderboard: true,

    // Digital Badge & Certification
    issue_badge: true,
    badge_title: 'Microsoft Azure & Cloud Fundamentals Master',

    // Questions List
    questions: []
  });

  // Helper to format Date object into local YYYY-MM-DD string
  const formatLocalDate = (d) => {
    if (!d) return '';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return '';
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch Available Badges from Verification Portal
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoadingBadges(true);
        const res = await api.get('/api/student/available-badges');
        if (res.data?.badges && Array.isArray(res.data.badges)) {
          setAvailableBadges(res.data.badges);
        }
      } catch (err) {
        console.warn('Failed to load badges list:', err);
      } finally {
        setLoadingBadges(false);
      }
    };
    fetchBadges();
  }, []);

  // Pre-fill quiz data if editing
  useEffect(() => {
    if (!id) return;
    const fetchQuizDetails = async () => {
      try {
        setLoadingQuiz(true);
        const res = await api.get(`/api/scheduled-quizzes/${id}`);
        const q = res.data?.quiz;
        if (q) {
          let sConf = {};
          try { sConf = typeof q.schedule_config === 'string' ? JSON.parse(q.schedule_config) : (q.schedule_config || {}); } catch(e){}

          const occurrences = q.occurrences || [];
          const firstOcc = occurrences.length > 0 ? occurrences[0] : null;
          const startDateRaw = firstOcc?.start_time || q.scheduled_start;
          const endDateRaw = firstOcc?.end_time || q.scheduled_end;

          let sHh = '10', sMm = '00', sSs = '00', sAmpm = 'AM';
          let eHh = '11', eMm = '00', eSs = '00', eAmpm = 'AM';

          if (startDateRaw) {
            const sD = new Date(startDateRaw);
            if (!isNaN(sD.getTime())) {
              const h = sD.getHours();
              sAmpm = h >= 12 ? 'PM' : 'AM';
              sHh = String((h % 12) || 12).padStart(2, '0');
              sMm = String(sD.getMinutes()).padStart(2, '0');
              sSs = String(sD.getSeconds()).padStart(2, '0');
            }
          }

          if (endDateRaw) {
            const eD = new Date(endDateRaw);
            if (!isNaN(eD.getTime())) {
              const h = eD.getHours();
              eAmpm = h >= 12 ? 'PM' : 'AM';
              eHh = String((h % 12) || 12).padStart(2, '0');
              eMm = String(eD.getMinutes()).padStart(2, '0');
              eSs = String(eD.getSeconds()).padStart(2, '0');
            }
          }

          setFormData({
            title: q.title || '',
            custom_slug: q.custom_slug || '',
            description: q.description || '',
            category: q.subject || 'Cloud',
            difficulty: q.difficulty || 'Intermediate',
            instructions: q.instructions || '',
            schedule_type: q.schedule_type || 'ONE_TIME',
            start_date: startDateRaw ? formatLocalDate(startDateRaw) : today,
            end_date: endDateRaw ? formatLocalDate(endDateRaw) : (startDateRaw ? formatLocalDate(startDateRaw) : today),
            start_time_hh: sHh,
            start_time_mm: sMm,
            start_time_ss: sSs,
            start_time_ampm: sAmpm,
            end_time_hh: eHh,
            end_time_mm: eMm,
            end_time_ss: eSs,
            end_time_ampm: eAmpm,
            timezone: q.timezone || 'Asia/Kolkata',
            days_of_week: sConf.daysOfWeek || ['MON'],
            weeks_pattern: sConf.weeksPattern || '1_3',
            day_of_month: sConf.dayOfMonth || 1,
            custom_interval_days: sConf.customIntervalDays || 3,
            time_limit: q.time_limit || 30,
            max_attempts: q.max_attempts !== undefined ? q.max_attempts : 1,
            score_policy: q.score_policy || 'BEST',
            shuffle_questions: q.shuffle_questions !== undefined ? q.shuffle_questions : true,
            shuffle_answers: q.shuffle_answers !== undefined ? q.shuffle_answers : true,
            require_fullscreen: q.require_fullscreen !== undefined ? q.require_fullscreen : false,
            anti_cheat_enabled: q.anti_cheat_enabled !== undefined ? q.anti_cheat_enabled : true,
            max_violations: q.max_violations || 3,
            positive_marks: q.positive_marks || 1,
            negative_marks: q.negative_marks || 0,
            show_leaderboard: q.show_leaderboard !== undefined ? q.show_leaderboard : true,
            issue_badge: Boolean(q.badge_title),
            badge_title: q.badge_title || 'Microsoft Azure & Cloud Fundamentals Master',
            questions: q.questions || []
          });

          // Populate custom sections from loaded questions if present
          if (q.questions && Array.isArray(q.questions)) {
            const loadedSections = {};
            q.questions.forEach(ques => {
              const occNum = ques.occurrence_number || 1;
              if (ques.section_name) {
                loadedSections[occNum] = {
                  name: ques.section_name,
                  description: ques.section_description || ''
                };
              }
            });
            setCustomSections(loadedSections);
          }
        }
      } catch (err) {
        console.error('Fetch quiz for edit error:', err);
        setErrorMessage('Failed to load quiz details for editing.');
      } finally {
        setLoadingQuiz(false);
      }
    };

    fetchQuizDetails();
  }, [id]);

  // Helper to format start/end time into 24-hour HH:mm:ss string for API payload
  const buildTimeString = (hh, mm, ss, ampm) => {
    let h = parseInt(hh || '0', 10);
    if (timeFormat12) {
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
    }
    const hStr = h.toString().padStart(2, '0');
    const mStr = (mm || '00').padStart(2, '0');
    const sStr = (ss || '00').padStart(2, '0');
    return `${hStr}:${mStr}:${sStr}`;
  };

  const handleDownloadPreviewQR = () => {
    const svg = document.getElementById('create-scheduled-quiz-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    canvas.width = 600;
    canvas.height = 700;

    img.onload = () => {
      const bgGrad = ctx.createLinearGradient(0, 0, 600, 700);
      bgGrad.addColorStop(0, '#0F172A');
      bgGrad.addColorStop(0.5, '#1E1B4B');
      bgGrad.addColorStop(1, '#0F172A');
      ctx.fillStyle = bgGrad;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(0, 0, 600, 700, 32);
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, 600, 700);
      }

      ctx.fillStyle = '#F25022';
      ctx.fillRect(40, 40, 130, 4);
      ctx.fillStyle = '#7FBA00';
      ctx.fillRect(170, 40, 130, 4);
      ctx.fillStyle = '#00A4EF';
      ctx.fillRect(300, 40, 130, 4);
      ctx.fillStyle = '#FFB900';
      ctx.fillRect(430, 40, 130, 4);

      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 12px Segoe UI, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MICROSOFT STUDENT CLUB PRPCEM', 300, 75);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Segoe UI, system-ui, sans-serif';
      const titleText = formData.title || 'Scheduled Assessment';
      ctx.fillText(titleText.length > 36 ? titleText.slice(0, 36) + '...' : titleText, 300, 115);

      ctx.fillStyle = '#FFFFFF';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(140, 150, 320, 320, 24);
        ctx.fill();
      } else {
        ctx.fillRect(140, 150, 320, 320);
      }

      ctx.drawImage(img, 160, 170, 280, 280);

      const vanityUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://quiz.mscprpcem.tech'}/q/${formData.custom_slug || 'preview'}`;
      ctx.fillStyle = '#FDE68A';
      ctx.font = 'bold 14px Segoe UI, monospace';
      ctx.fillText(vanityUrl, 300, 520);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '600 13px Segoe UI, sans-serif';
      ctx.fillText('Scan QR or visit link to join quiz session directly', 300, 560);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(160, 600, 280, 40, 12);
        ctx.fill();
      } else {
        ctx.fillRect(160, 600, 280, 40);
      }

      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 12px Segoe UI, sans-serif';
      ctx.fillText('Official Assessment • MSC Platform', 300, 625);

      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `msc-quiz-${formData.custom_slug || 'preview'}-join-card.png`;
      a.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Step Validation Enforcer
  const validateTab = (tabIndex) => {
    setErrorMessage('');
    if (tabIndex === 1) {
      if (!formData.title.trim()) {
        setErrorMessage('Quiz Title is required.');
        return false;
      }
      if (!formData.start_date || !formData.end_date) {
        setErrorMessage('Start Date and End Date are required.');
        return false;
      }
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        setErrorMessage('Start Date cannot be after End Date.');
        return false;
      }
    }
    return true;
  };

  const handleNextTab = () => {
    if (validateTab(activeTab)) {
      setActiveTab(prev => Math.min(4, prev + 1));
    }
  };

  // CSV / Excel File Upload & Parser with dynamic Section Name mapping
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawData || rawData.length === 0) {
          alert('No question rows found in uploaded file.');
          return;
        }

        const sections = calculateScheduleOccurrences();
        const extractedSections = { ...customSections };

        const parsedQuestions = rawData.map((row, idx) => {
          // Normalize column names flexibly
          const qText = row.Question || row.question || row.QuestionText || row.Prompt || row.prompt || row.Title || '';
          const optA = row['Option A'] || row.option_a || row.OptionA || row.A || row['Option 1'] || '';
          const optB = row['Option B'] || row.option_b || row.OptionB || row.B || row['Option 2'] || '';
          const optC = row['Option C'] || row.option_c || row.OptionC || row.C || row['Option 3'] || '';
          const optD = row['Option D'] || row.option_d || row.OptionD || row.D || row['Option 4'] || '';
          const correct = (row['Correct Answer'] || row.correct_answer || row.Correct || row.Answer || row.answer || 'A').toString().trim().toUpperCase();
          const explanation = row.Explanation || row.explanation || row.Rationale || row.solution || '';

          let secNum = activeSectionFilter > 0 ? activeSectionFilter : 1;
          const rawSec = row.Section || row.section || row.Occurrence || row.occurrence || row.Round || row.round || row.Week || row.week || row.Day || row.day || row.Session || row.session;
          if (rawSec !== undefined && rawSec !== '') {
            const parsedNum = parseInt(String(rawSec).replace(/[^0-9]/g, ''), 10);
            if (!isNaN(parsedNum) && parsedNum > 0) {
              secNum = parsedNum;
            }
          }

          const secNameInFile = row['Section Name'] || row.section_name || row['Section Title'] || row.section_title || row['Round Name'] || row.round_name;
          if (secNameInFile && typeof secNameInFile === 'string' && secNameInFile.trim()) {
            extractedSections[secNum] = {
              ...(extractedSections[secNum] || {}),
              name: secNameInFile.trim()
            };
          }

          const secInfo = sections.find(s => s.number === secNum) || sections[0];
          const secName = extractedSections[secNum]?.name || customSections[secNum]?.name || secInfo?.name || `Section ${secNum}`;
          const secDesc = extractedSections[secNum]?.description || customSections[secNum]?.description || secInfo?.description || '';

          return {
            question: qText,
            option_a: optA,
            option_b: optB,
            option_c: optC,
            option_d: optD,
            correct_answer: ['A', 'B', 'C', 'D'].includes(correct) ? correct : 'A',
            explanation,
            occurrence_number: secNum,
            section_name: secName,
            section_description: secDesc
          };
        }).filter(q => q.question);

        if (Object.keys(extractedSections).length > 0) {
          setCustomSections(extractedSections);
        }

        setFormData(prev => ({
          ...prev,
          questions: [...prev.questions, ...parsedQuestions]
        }));

        alert(`Successfully imported ${parsedQuestions.length} questions across sections from ${file.name}!`);
      } catch (err) {
        console.error('CSV/Excel parse error:', err);
        alert('Failed to parse spreadsheet. Please ensure standard column headers: Section, Section Name, Question, Option A, Option B, Option C, Option D, Correct Answer.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // Calculate schedule occurrences dynamically from date range and frequency pattern
  const calculateScheduleOccurrences = () => {
    if (!formData.start_date) return [{ number: 1, name: 'Round 1', dateLabel: '', description: '' }];
    try {
      const [sY, sM, sD] = formData.start_date.split('-').map(Number);
      const start = new Date(sY, sM - 1, sD);
      const [eY, eM, eD] = (formData.end_date || formData.start_date).split('-').map(Number);
      const end = new Date(eY, eM - 1, eD);

      const dayMap = { 'SUN': 0, 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6 };
      const list = [];
      let count = 1;
      let curr = new Date(start);

      if (formData.schedule_type === 'ONE_TIME') {
        const title = customSections[1]?.name || `${formData.title || 'Session 1'} (One-Time)`;
        const desc = customSections[1]?.description || 'Complete all questions in this session.';
        list.push({
          number: 1,
          name: title,
          dateLabel: start.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
          description: desc
        });
      } else if (formData.schedule_type === 'DAILY') {
        while (curr <= end && count <= 60) {
          const title = customSections[count]?.name || `Day ${count}`;
          const desc = customSections[count]?.description || `Daily assessment round for Day ${count}`;
          list.push({
            number: count,
            name: title,
            dateLabel: curr.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
            description: desc
          });
          curr.setDate(curr.getDate() + 1);
          count++;
        }
      } else if (formData.schedule_type === 'WEEKLY') {
        const targetDays = (formData.days_of_week && formData.days_of_week.length > 0)
          ? formData.days_of_week.map(d => dayMap[d]).filter(d => d !== undefined)
          : null;

        while (curr <= end && count <= 52) {
          const dayOfWeek = curr.getDay();
          if (!targetDays || targetDays.includes(dayOfWeek)) {
            const title = customSections[count]?.name || `Week ${count}`;
            const desc = customSections[count]?.description || `Weekly assessment round for Week ${count}`;
            list.push({
              number: count,
              name: title,
              dateLabel: curr.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
              description: desc
            });
            count++;
          }
          curr.setDate(curr.getDate() + 1);
        }
      } else if (formData.schedule_type === 'BIWEEKLY') {
        while (curr <= end && count <= 30) {
          const title = customSections[count]?.name || `Biweekly #${count}`;
          const desc = customSections[count]?.description || `Biweekly round #${count}`;
          list.push({
            number: count,
            name: title,
            dateLabel: curr.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
            description: desc
          });
          curr.setDate(curr.getDate() + 14);
          count++;
        }
      } else if (formData.schedule_type === 'MONTHLY') {
        while (curr <= end && count <= 24) {
          const title = customSections[count]?.name || `Month ${count}`;
          const desc = customSections[count]?.description || `Monthly assessment round #${count}`;
          list.push({
            number: count,
            name: title,
            dateLabel: curr.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
            description: desc
          });
          curr.setMonth(curr.getMonth() + 1);
          count++;
        }
      } else {
        // CUSTOM
        const step = parseInt(formData.custom_interval_days || 3, 10);
        while (curr <= end && count <= 30) {
          const title = customSections[count]?.name || `Round ${count}`;
          const desc = customSections[count]?.description || `Custom interval round #${count}`;
          list.push({
            number: count,
            name: title,
            dateLabel: curr.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
            description: desc
          });
          curr.setDate(curr.getDate() + step);
          count++;
        }
      }

      return list.length > 0 ? list : [{ number: 1, name: 'Round 1', dateLabel: start.toLocaleDateString(), description: '' }];
    } catch (e) {
      return [{ number: 1, name: 'Round 1', dateLabel: '', description: '' }];
    }
  };

  const handleAddQuestion = (targetOccurrenceNumber, count = 1) => {
    const occNumber = (targetOccurrenceNumber !== undefined && targetOccurrenceNumber > 0)
      ? targetOccurrenceNumber 
      : (activeSectionFilter > 0 ? activeSectionFilter : 1);
    const sections = calculateScheduleOccurrences();
    const sectionInfo = sections.find(s => s.number === occNumber);
    const secName = customSections[occNumber]?.name || sectionInfo?.name || `Section ${occNumber}`;
    const secDesc = customSections[occNumber]?.description || sectionInfo?.description || '';

    const newQuestions = Array.from({ length: count }, () => ({
      question: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      explanation: '',
      occurrence_number: occNumber,
      section_name: secName,
      section_description: secDesc
    }));

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, ...newQuestions]
    }));
  };

  const handleDistributeEvenly = () => {
    const sections = calculateScheduleOccurrences();
    if (sections.length === 0 || formData.questions.length === 0) {
      alert('Please add questions first to distribute across sections.');
      return;
    }
    
    const updated = formData.questions.map((q, idx) => {
      const sectionIdx = idx % sections.length;
      const targetSec = sections[sectionIdx];
      return {
        ...q,
        occurrence_number: targetSec.number,
        section_name: customSections[targetSec.number]?.name || targetSec.name,
        section_description: customSections[targetSec.number]?.description || targetSec.description
      };
    });

    setFormData(prev => ({ ...prev, questions: updated }));
    alert(`Successfully distributed ${formData.questions.length} questions across ${sections.length} sections (${Math.ceil(formData.questions.length / sections.length)} questions per section)!`);
  };

  const handleUpdateSectionMeta = (secNumber, field, value) => {
    setCustomSections(prev => ({
      ...prev,
      [secNumber]: {
        ...(prev[secNumber] || {}),
        [field]: value
      }
    }));
    // Also update questions in this section
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if ((q.occurrence_number || 1) === secNumber) {
          return {
            ...q,
            section_name: field === 'name' ? value : q.section_name,
            section_description: field === 'description' ? value : q.section_description
          };
        }
        return q;
      })
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, idx) => {
        if (idx === index) {
          return { ...q, [field]: value };
        }
        return q;
      })
    }));
  };

  const handleRemoveQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== index)
    }));
  };

  const handleToggleDayOfWeek = (dayCode) => {
    setFormData(prev => {
      const exists = prev.days_of_week.includes(dayCode);
      const updated = exists 
        ? prev.days_of_week.filter(d => d !== dayCode)
        : [...prev.days_of_week, dayCode];
      return { ...prev, days_of_week: updated.length ? updated : [dayCode] };
    });
  };

  // Download Dynamic CSV or Excel Template tailored to schedule type (Weekly, Biweekly, Monthly, Daily, One-Time, Custom)
  const handleDownloadTemplate = (format = 'xlsx') => {
    const sections = calculateScheduleOccurrences();
    const scheduleType = formData.schedule_type || 'ONE_TIME';
    const sampleData = [];

    // Define rich, educational sample questions tailored per section / occurrence
    sections.slice(0, Math.min(sections.length, 12)).forEach((sec) => {
      const secNum = sec.number;
      const secName = customSections[secNum]?.name || sec.name || `Section ${secNum}`;
      
      let q1 = {
        'Section': secNum,
        'Section Name': secName,
        'Question': `What is a core benefit of cloud computing featured in ${secName}?`,
        'Option A': 'High availability and on-demand scalability',
        'Option B': 'Fixed hardware maintenance costs',
        'Option C': 'Manual operating system patching',
        'Option D': 'Physical server room requirement',
        'Correct Answer': 'A',
        'Explanation': 'Cloud computing delivers elastic scalability and high availability on-demand.'
      };

      let q2 = {
        'Section': secNum,
        'Section Name': secName,
        'Question': `Which protocol is primarily used for secure web traffic in ${secName}?`,
        'Option A': 'HTTP',
        'Option B': 'HTTPS',
        'Option C': 'FTP',
        'Option D': 'Telnet',
        'Correct Answer': 'B',
        'Explanation': 'HTTPS encrypts communication between the client browser and the server using TLS/SSL.'
      };

      sampleData.push(q1, q2);
    });

    // Fallback if no sections
    if (sampleData.length === 0) {
      sampleData.push({
        'Section': 1,
        'Section Name': 'Round 1',
        'Question': 'What does CPU stand for?',
        'Option A': 'Central Processing Unit',
        'Option B': 'Central Program Utility',
        'Option C': 'Computer Personal Unit',
        'Option D': 'Central Processor Unifier',
        'Correct Answer': 'A',
        'Explanation': 'CPU is the Central Processing Unit.'
      });
    }

    const baseFileName = `${(formData.title || 'scheduled_quiz').toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${scheduleType.toLowerCase()}_template`;

    if (format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const csvOutput = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${baseFileName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Questions');
      ws['!cols'] = [
        { wch: 10 }, { wch: 28 }, { wch: 45 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 45 }
      ];
      XLSX.writeFile(wb, `${baseFileName}.xlsx`);
    }
  };

  const handlePublishSubmit = async () => {
    if (!validateTab(1)) return;

    const startTimeStr = buildTimeString(formData.start_time_hh, formData.start_time_mm, formData.start_time_ss, formData.start_time_ampm);
    const endTimeStr = buildTimeString(formData.end_time_hh, formData.end_time_mm, formData.end_time_ss, formData.end_time_ampm);

    // Compute exact local ISO strings
    let startIso = null;
    let endIso = null;
    try {
      const [sY, sM, sD] = formData.start_date.split('-').map(Number);
      const [sH, sMin, sSec] = startTimeStr.split(':').map(Number);
      const sDateObj = new Date(sY, sM - 1, sD, sH, sMin, sSec);
      startIso = sDateObj.toISOString();

      const [eY, eM, eD] = (formData.end_date || formData.start_date).split('-').map(Number);
      const [eH, eMin, eSec] = endTimeStr.split(':').map(Number);
      const eDateObj = new Date(eY, eM - 1, eD, eH, eMin, eSec);
      endIso = eDateObj.toISOString();
    } catch(e) {
      console.warn('ISO date calculation warning:', e);
    }

    const payload = {
      title: formData.title,
      custom_slug: formData.custom_slug,
      description: formData.description,
      category: formData.category,
      difficulty: formData.difficulty,
      instructions: formData.instructions,
      schedule_type: formData.schedule_type,
      start_date: formData.start_date,
      end_date: formData.end_date,
      start_time: startTimeStr,
      end_time: endTimeStr,
      start_iso: startIso,
      end_iso: endIso,
      timezone: formData.timezone,
      time_limit: formData.time_limit,
      max_attempts: formData.max_attempts,
      score_policy: formData.score_policy,
      shuffle_questions: formData.shuffle_questions,
      shuffle_answers: formData.shuffle_answers,
      require_fullscreen: formData.require_fullscreen,
      anti_cheat_enabled: formData.anti_cheat_enabled,
      max_violations: formData.max_violations,
      positive_marks: formData.positive_marks,
      negative_marks: formData.negative_marks,
      show_leaderboard: formData.show_leaderboard,
      badge_title: formData.issue_badge ? (formData.badge_title || 'Certified Master') : null,
      questions: formData.questions,
      schedule_config: {
        daysOfWeek: formData.days_of_week,
        weeksPattern: formData.weeks_pattern,
        dayOfMonth: formData.day_of_month,
        customIntervalDays: formData.custom_interval_days,
        start_iso: startIso,
        end_iso: endIso
      }
    };

    try {
      setSaving(true);
      if (isEditMode) {
        await api.put(`/api/scheduled-quizzes/${id}`, payload);
        alert('Scheduled Quiz updated successfully!');
      } else {
        await api.post('/api/scheduled-quizzes', payload);
        alert('Scheduled Quiz published successfully!');
      }
      navigate('/admin/scheduled-quizzes');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save scheduled quiz.');
    } finally {
      setSaving(false);
    }
  };

  const DAYS = [
    { code: 'MON', label: 'Mon' },
    { code: 'TUE', label: 'Tue' },
    { code: 'WED', label: 'Wed' },
    { code: 'THU', label: 'Thu' },
    { code: 'FRI', label: 'Fri' },
    { code: 'SAT', label: 'Sat' },
    { code: 'SUN', label: 'Sun' }
  ];

  if (loadingQuiz) {
    return (
      <div className="py-20 text-center text-slate-400 font-extrabold animate-pulse">
        Loading quiz details for editing...
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left font-segoe pb-16">
      
      {/* ════════ HEADER BAR ════════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-2xs">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/scheduled-quizzes')}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
            title="Back to Scheduled Quizzes"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
              {isEditMode ? 'Scheduled Quiz Editor' : 'Scheduled Quiz Creator'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {isEditMode ? 'Edit Scheduled Quiz' : 'Create Scheduled Quiz'}
            </h1>
          </div>
        </div>

        <button
          onClick={handlePublishSubmit}
          disabled={saving}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer"
        >
          {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Publish Scheduled Quiz'}
        </button>
      </div>

      {/* ════════ STEP TABS ════════ */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-2 shadow-2xs space-x-2 overflow-x-auto">
        {[
          { id: 1, title: '1. Basic & Recurrence' },
          { id: 2, title: `2. Questions & Excel Import (${formData.questions.length})` },
          { id: 3, title: '3. Rules & Proctoring' },
          { id: 4, title: '4. Review & Publish' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (validateTab(activeTab)) setActiveTab(tab.id);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-extrabold flex items-center space-x-2">
          <AlertTriangle size={18} className="flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ════════ TAB 1: BASIC INFORMATION & RECURRENCE ════════ */}
      {activeTab === 1 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xs">
          
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b pb-2">Basic Quiz Details</h3>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">Quiz Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. Azure Fundamentals Weekly Assessment"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full border rounded-xl px-4 py-2.5 text-xs font-bold bg-slate-50 focus:bg-white focus:border-blue-600"
              />
            </div>

            <div className="p-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-2xl space-y-4">
              <div className="flex items-center space-x-2">
                <QrCode size={18} className="text-blue-600" />
                <span className="text-xs font-black text-blue-900 uppercase tracking-wider">
                  Custom URL
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Custom URL</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-slate-500 bg-white border border-slate-200 px-3 py-2 rounded-xl whitespace-nowrap">
                      {typeof window !== 'undefined' ? `${window.location.host}/q/` : 'quiz.mscprpcem.tech/q/'}
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. test"
                      value={formData.custom_slug}
                      onChange={e => setFormData({ ...formData, custom_slug: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') })}
                      className="w-full border border-blue-300 rounded-xl px-3.5 py-2 text-xs font-black text-blue-700 bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                    Students visiting <strong className="text-blue-600">{typeof window !== 'undefined' ? window.location.host : 'quiz.mscprpcem.tech'}/q/{formData.custom_slug || 'test'}</strong> or scanning the QR code will open this quiz session directly.
                  </p>
                </div>

                {/* Live QR Code Preview */}
                <div className="bg-white p-3 border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-2 shadow-2xs">
                  <QRCodeSVG
                    id="create-scheduled-quiz-qr-svg"
                    value={`${typeof window !== 'undefined' ? window.location.origin : 'https://quiz.mscprpcem.tech'}/q/${formData.custom_slug || 'test'}`}
                    size={84}
                    bgColor="#FFFFFF"
                    fgColor="#0F172A"
                    level="M"
                  />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Scan to Join Direct</span>
                  <button
                    type="button"
                    onClick={handleDownloadPreviewQR}
                    className="w-full py-1 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold rounded-lg text-[10px] flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                    title="Download Direct Join Card Image"
                  >
                    <Download size={11} />
                    <span>Download Card</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">Description</label>
              <textarea
                rows={3}
                placeholder="Overview of topics tested, guidelines, and passing criteria..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded-xl px-4 py-2.5 text-xs font-semibold bg-slate-50 focus:bg-white focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category Searchable & Creatable Combobox */}
              <div className="space-y-1 relative" ref={categoryDropdownRef}>
                <label className="block text-xs font-bold text-slate-600">Category</label>
                <div className="relative">
                  <div 
                    onClick={() => setIsCategoryOpen(prev => !prev)}
                    className="w-full border rounded-xl px-3.5 py-2 text-xs font-bold bg-white text-slate-800 flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-blue-500 hover:border-slate-300 shadow-2xs"
                  >
                    <span className="truncate">{formData.category || 'Select Category...'}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isCategoryOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search or create category..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                        {categoriesList
                          .filter(cat => cat.toLowerCase().includes(categorySearch.trim().toLowerCase()))
                          .map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, category: cat });
                                setIsCategoryOpen(false);
                                setCategorySearch('');
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                                formData.category === cat ? 'bg-blue-50 text-blue-700 font-black' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span>{cat}</span>
                              {formData.category === cat && <Check size={13} className="text-blue-600" />}
                            </button>
                          ))}

                        {/* If typed search query doesn't match any category, give option to create */}
                        {categorySearch.trim() && !categoriesList.some(c => c.toLowerCase() === categorySearch.trim().toLowerCase()) && (
                          <button
                            type="button"
                            onClick={() => {
                              const newCat = categorySearch.trim();
                              setCategoriesList(prev => [...prev, newCat]);
                              setFormData({ ...formData, category: newCat });
                              setIsCategoryOpen(false);
                              setCategorySearch('');
                            }}
                            className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 flex items-center space-x-1.5 transition-all cursor-pointer"
                          >
                            <Plus size={14} className="text-blue-600 flex-shrink-0" />
                            <span className="truncate">+ Create "<strong>{categorySearch.trim()}</strong>"</span>
                          </button>
                        )}

                        {categoriesList.filter(cat => cat.toLowerCase().includes(categorySearch.trim().toLowerCase())).length === 0 && !categorySearch.trim() && (
                          <div className="text-center py-3 text-[11px] text-slate-400 font-semibold">
                            No categories available
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full border rounded-xl px-3.5 py-2 text-xs font-bold bg-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Granular Recurrence Section */}
          <div className="space-y-6 pt-4 border-t">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Recurrence & Time Window</h3>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600">Schedule Pattern</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-bold">
                {['ONE_TIME', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      const isOneTime = st === 'ONE_TIME';
                      setFormData(prev => ({
                        ...prev,
                        schedule_type: st,
                        end_date: isOneTime ? prev.start_date : (prev.end_date || nextMonth)
                      }));
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      formData.schedule_type === st 
                        ? 'bg-blue-600 text-white font-black border-blue-600 shadow-xs' 
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Granular Weekly / Biweekly Days Selection */}
            {(formData.schedule_type === 'WEEKLY' || formData.schedule_type === 'BIWEEKLY') && (
              <div className="p-5 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-4">
                <span className="text-xs font-extrabold text-blue-900 block">Select Active Day(s) of the Week</span>
                
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => {
                    const isSelected = formData.days_of_week.includes(day.code);
                    return (
                      <button
                        key={day.code}
                        type="button"
                        onClick={() => handleToggleDayOfWeek(day.code)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-white border text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>

                {formData.schedule_type === 'BIWEEKLY' && (
                  <div className="space-y-1 pt-2 border-t border-blue-200/60">
                    <label className="block text-xs font-bold text-slate-700">Biweekly Week Pattern</label>
                    <select
                      value={formData.weeks_pattern}
                      onChange={e => setFormData({ ...formData, weeks_pattern: e.target.value })}
                      className="border rounded-xl px-3 py-2 text-xs font-bold bg-white"
                    >
                      <option value="1_3">1st & 3rd Weeks of the Month</option>
                      <option value="2_4">2nd & 4th Weeks of the Month</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Monthly Day Selection */}
            {formData.schedule_type === 'MONTHLY' && (
              <div className="p-5 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-3">
                <span className="text-xs font-extrabold text-purple-900 block">Monthly Schedule Option</span>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="font-bold text-slate-600">Run on Day of Month:</span>
                  <select
                    value={formData.day_of_month}
                    onChange={e => setFormData({ ...formData, day_of_month: parseInt(e.target.value, 10) })}
                    className="border rounded-xl px-3 py-2 text-xs font-bold bg-white"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>Day {num}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Custom Interval Configuration */}
            {formData.schedule_type === 'CUSTOM' && (
              <div className="p-5 bg-amber-50/60 border border-amber-100 rounded-2xl space-y-4">
                <span className="text-xs font-extrabold text-amber-900 block">Custom Repeat Interval</span>
                
                <div className="flex items-center space-x-3 text-xs">
                  <span className="font-bold text-slate-600">Repeat Every</span>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={formData.custom_interval_days}
                    onChange={e => setFormData({ ...formData, custom_interval_days: parseInt(e.target.value, 10) || 3 })}
                    className="w-16 border rounded-xl p-2 text-center text-xs font-bold bg-white"
                  />
                  <span className="font-bold text-slate-600">Day(s)</span>
                </div>

                <div className="space-y-2 pt-2 border-t border-amber-200/60">
                  <span className="text-xs font-bold text-slate-700 block">Active Day(s) of the Week (Optional)</span>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => {
                      const isSelected = formData.days_of_week.includes(day.code);
                      return (
                        <button
                          key={day.code}
                          type="button"
                          onClick={() => handleToggleDayOfWeek(day.code)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            isSelected ? 'bg-amber-600 text-white shadow-xs' : 'bg-white border text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {formData.schedule_type === 'ONE_TIME' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600">
                      Quiz Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          start_date: val,
                          end_date: (prev.end_date < val || prev.end_date === prev.start_date) ? val : prev.end_date
                        }));
                      }}
                      className="w-full border rounded-xl px-3.5 py-2 text-xs font-bold bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600">
                      Quiz End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={formData.start_date}
                      value={formData.end_date || formData.start_date}
                      onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full border rounded-xl px-3.5 py-2 text-xs font-bold bg-white"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  For single-day assessments, keep Start Date and End Date the same. For multi-day window access, select your concluding End Date.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Start Date (Series Starts) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full border rounded-xl px-3.5 py-2 text-xs font-bold bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    End Date (Series Ends) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={formData.start_date}
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full border rounded-xl px-3.5 py-2 text-xs font-bold bg-white"
                  />
                </div>
              </div>
            )}

            {/* Time Window with Seconds & 12h / 24h Toggle */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  {formData.schedule_type === 'ONE_TIME' ? 'Quiz Slot Time Window' : 'Daily Time Window (HH:MM:SS)'}
                </span>
                
                <div className="flex items-center space-x-2 text-xs font-bold">
                  <span className="text-slate-400">Format:</span>
                  <button
                    type="button"
                    onClick={() => setTimeFormat12(!timeFormat12)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-blue-600 font-extrabold cursor-pointer"
                  >
                    {timeFormat12 ? '12-Hour AM/PM' : '24-Hour'}
                  </button>
                </div>
              </div>

              {/* Start Time & End Time Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Start Time */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    {formData.schedule_type === 'ONE_TIME' ? 'Quiz Start Time' : 'Daily Start Time'}
                  </label>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      min="1"
                      max={timeFormat12 ? 12 : 23}
                      placeholder="HH"
                      value={formData.start_time_hh}
                      onChange={e => setFormData({ ...formData, start_time_hh: e.target.value })}
                      className="w-14 border rounded-xl p-2 text-center text-xs font-bold bg-white"
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="MM"
                      value={formData.start_time_mm}
                      onChange={e => setFormData({ ...formData, start_time_mm: e.target.value })}
                      className="w-14 border rounded-xl p-2 text-center text-xs font-bold bg-white"
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="SS"
                      value={formData.start_time_ss}
                      onChange={e => setFormData({ ...formData, start_time_ss: e.target.value })}
                      className="w-14 border rounded-xl p-2 text-center text-xs font-bold bg-white"
                    />

                    {timeFormat12 && (
                      <select
                        value={formData.start_time_ampm}
                        onChange={e => setFormData({ ...formData, start_time_ampm: e.target.value })}
                        className="border rounded-xl p-2 text-xs font-bold bg-white"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* End Time */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    {formData.schedule_type === 'ONE_TIME' ? 'Quiz End Time' : 'Daily End Time'}
                  </label>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      min="1"
                      max={timeFormat12 ? 12 : 23}
                      placeholder="HH"
                      value={formData.end_time_hh}
                      onChange={e => setFormData({ ...formData, end_time_hh: e.target.value })}
                      className="w-14 border rounded-xl p-2 text-center text-xs font-bold bg-white"
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="MM"
                      value={formData.end_time_mm}
                      onChange={e => setFormData({ ...formData, end_time_mm: e.target.value })}
                      className="w-14 border rounded-xl p-2 text-center text-xs font-bold bg-white"
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="SS"
                      value={formData.end_time_ss}
                      onChange={e => setFormData({ ...formData, end_time_ss: e.target.value })}
                      className="w-14 border rounded-xl p-2 text-center text-xs font-bold bg-white"
                    />

                    {timeFormat12 && (
                      <select
                        value={formData.end_time_ampm}
                        onChange={e => setFormData({ ...formData, end_time_ampm: e.target.value })}
                        className="border rounded-xl p-2 text-xs font-bold bg-white"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Dynamic Calculated Occurrences & Section Breakdown */}
            {(() => {
              const calculatedOccs = calculateScheduleOccurrences();
              return (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs flex-shrink-0">
                      <Layers size={20} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span>⚡ {calculatedOccs.length} {formData.schedule_type === 'DAILY' ? 'Daily' : formData.schedule_type === 'WEEKLY' ? 'Weekly' : 'Scheduled'} Rounds Calculated</span>
                        <span className="px-2 py-0.5 bg-blue-200/80 text-blue-900 rounded-full text-[9px] font-black uppercase">
                          Non-Repeating Pool
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
                        {calculatedOccs.length} dedicated question sections ({calculatedOccs[0]?.name || 'Round 1'} to {calculatedOccs[calculatedOccs.length - 1]?.name || `Round ${calculatedOccs.length}`}) will be created. Questions assigned to each round will not repeat.
                      </p>
                    </div>
                  </div>
                  <span className="px-3.5 py-1.5 bg-blue-600 text-white font-black rounded-xl text-xs shadow-xs whitespace-nowrap">
                    {calculatedOccs.length} Sections
                  </span>
                </div>
              );
            })()}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleNextTab}
              className="px-6 py-2.5 bg-blue-600 text-white font-extrabold rounded-xl text-xs flex items-center space-x-2 cursor-pointer shadow-sm"
            >
              <span>Next: Manage Questions by Section</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      )}

      {/* ════════ TAB 2: QUESTIONS & SECTIONS MANAGEMENT ════════ */}
      {activeTab === 2 && (() => {
        const sections = calculateScheduleOccurrences();
        const isMultiSection = sections.length > 1;
        const currentSection = activeSectionFilter > 0 ? sections.find(s => s.number === activeSectionFilter) : null;
        
        // Helper to render a question card
        const renderQuestionCard = (q, origIdx) => {
          const currentOccNum = q.occurrence_number || 1;
          const secInfo = sections.find(s => s.number === currentOccNum) || sections[0];
          const secDisplayName = customSections[currentOccNum]?.name || secInfo?.name || `Section ${currentOccNum}`;

          return (
            <div key={origIdx} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-left shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                    Q #{origIdx + 1}
                  </span>
                  
                  {/* Section Assignment Dropdown */}
                  {isMultiSection && (
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] font-bold text-slate-500">Assigned Round:</span>
                      <select
                        value={currentOccNum}
                        onChange={(e) => {
                          const newSecNum = parseInt(e.target.value, 10);
                          const newSec = sections.find(s => s.number === newSecNum);
                          handleQuestionChange(origIdx, 'occurrence_number', newSecNum);
                          handleQuestionChange(origIdx, 'section_name', customSections[newSecNum]?.name || newSec?.name || `Section ${newSecNum}`);
                          handleQuestionChange(origIdx, 'section_description', customSections[newSecNum]?.description || newSec?.description || '');
                        }}
                        className="bg-white border border-blue-300 text-blue-800 text-xs font-black rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        {sections.map(s => (
                          <option key={s.number} value={s.number}>
                            {customSections[s.number]?.name || s.name} ({s.dateLabel})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <button 
                  type="button" 
                  onClick={() => handleRemoveQuestion(origIdx)} 
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                  title="Delete Question"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Question Statement</label>
                <input
                  type="text"
                  placeholder="Enter question text..."
                  value={q.question}
                  onChange={e => handleQuestionChange(origIdx, 'question', e.target.value)}
                  className="w-full border rounded-xl px-4 py-2.5 text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">Option A</label>
                  <input
                    type="text"
                    placeholder="Option A"
                    value={q.option_a}
                    onChange={e => handleQuestionChange(origIdx, 'option_a', e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">Option B</label>
                  <input
                    type="text"
                    placeholder="Option B"
                    value={q.option_b}
                    onChange={e => handleQuestionChange(origIdx, 'option_b', e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">Option C</label>
                  <input
                    type="text"
                    placeholder="Option C"
                    value={q.option_c}
                    onChange={e => handleQuestionChange(origIdx, 'option_c', e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">Option D</label>
                  <input
                    type="text"
                    placeholder="Option D"
                    value={q.option_d}
                    onChange={e => handleQuestionChange(origIdx, 'option_d', e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-bold text-slate-600">Correct Option:</span>
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleQuestionChange(origIdx, 'correct_answer', opt)}
                      className={`w-8 h-8 rounded-xl font-black text-xs cursor-pointer transition-all ${
                        q.correct_answer === opt ? 'bg-emerald-600 text-white shadow-xs scale-105' : 'bg-white border text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] font-semibold text-slate-400">
                  Assigned to: <span className="font-bold text-slate-700">{secDisplayName}</span>
                </div>
              </div>
            </div>
          );
        };

        return (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">
            
            {/* Header & Global Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-black text-slate-900">
                    Questions & Sections ({formData.questions.length})
                  </h3>
                  {isMultiSection && (
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase">
                      {sections.length} Rounds
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isMultiSection 
                    ? 'Configure distinct question sets for each day/week. Questions will never repeat across rounds.'
                    : 'Upload a CSV/Excel file or add questions manually.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Distribute Evenly Button */}
                {isMultiSection && formData.questions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDistributeEvenly}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-extrabold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer transition-all"
                    title="Evenly distribute all questions across all rounds"
                  >
                    <Sparkles size={13} className="text-amber-600" />
                    <span>Distribute Evenly</span>
                  </button>
                )}

                {/* Add Question Button */}
                <button
                  type="button"
                  onClick={() => handleAddQuestion(activeSectionFilter > 0 ? activeSectionFilter : 1, 1)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Plus size={14} />
                  <span>Add Question</span>
                </button>
              </div>
            </div>

            {/* ════════ 2-STEP SPREADSHEET TEMPLATE & BULK IMPORT HUB ════════ */}
            <div className="p-5 bg-gradient-to-r from-slate-50 via-blue-50/40 to-indigo-50/40 border border-slate-200 rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                    <FileSpreadsheet size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Excel & CSV Bulk Question Import
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      First download the tailored spreadsheet template, fill in your questions, then upload below.
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-white border border-blue-200 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs">
                  {formData.schedule_type} Pattern • {sections.length} Round{sections.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* STEP 1: Download Template */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-2xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
                      <span className="text-xs font-black text-slate-800">Download Template</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed pl-7">
                      Pre-formatted with Section numbers and sample questions tailored for your <strong>{formData.schedule_type}</strong> schedule.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pl-7 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('xlsx')}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer transition-all active:scale-98 shadow-2xs"
                      title="Download Microsoft Excel (.xlsx) template"
                    >
                      <FileSpreadsheet size={14} className="text-emerald-600" />
                      <span>Excel Template (.xlsx)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('csv')}
                      className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 font-extrabold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer transition-all active:scale-98 shadow-2xs"
                      title="Download Standard CSV (.csv) template"
                    >
                      <FileText size={14} className="text-blue-600" />
                      <span>CSV Template (.csv)</span>
                    </button>
                  </div>
                </div>

                {/* STEP 2: Upload File */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-2xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
                      <span className="text-xs font-black text-slate-800">Upload Questions File</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed pl-7">
                      Upload your populated <code>.xlsx</code> or <code>.csv</code> file. Questions will automatically map to their designated sections.
                    </p>
                  </div>

                  <div className="pl-7 pt-1">
                    <label className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-md active:scale-98">
                      <Upload size={14} />
                      <span>Choose / Drag File to Import (.xlsx, .csv)</span>
                      <input
                        type="file"
                        accept=".csv, .xlsx, .xls"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Switcher Tabs (For Recurring Quizzes) */}
            {isMultiSection && (
              <div className="flex border border-slate-200 bg-slate-50 rounded-2xl p-1.5 space-x-1.5 overflow-x-auto shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveSectionFilter(0)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                    activeSectionFilter === 0
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  All Sections Overview ({formData.questions.length})
                </button>

                {sections.map(sec => {
                  const qCount = formData.questions.filter(q => (q.occurrence_number || 1) === sec.number).length;
                  const customName = customSections[sec.number]?.name || sec.name;
                  return (
                    <button
                      key={sec.number}
                      type="button"
                      onClick={() => setActiveSectionFilter(sec.number)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                        activeSectionFilter === sec.number
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-white'
                      }`}
                    >
                      <span>{customName}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        activeSectionFilter === sec.number ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {qCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* VIEW 1: SINGLE SECTION VIEW */}
            {activeSectionFilter > 0 && currentSection && (() => {
              const currentSectionQuestions = formData.questions
                .map((q, origIdx) => ({ ...q, origIdx }))
                .filter(q => (q.occurrence_number || 1) === activeSectionFilter);
              const secDisplayName = customSections[activeSectionFilter]?.name || currentSection.name;

              return (
                <div className="space-y-6">
                  {/* Active Section Custom Name & Description Editor */}
                  <div className="p-5 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 bg-blue-600 text-white font-black rounded-lg text-[10px] uppercase">
                          Round #{currentSection.number}
                        </span>
                        <span className="text-xs font-bold text-slate-600">
                          Scheduled Date: <strong>{currentSection.dateLabel}</strong>
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleAddQuestion(activeSectionFilter, 1)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs inline-flex items-center space-x-1"
                        >
                          <Plus size={13} />
                          <span>+1 Question</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddQuestion(activeSectionFilter, 5)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs inline-flex items-center space-x-1"
                        >
                          <Plus size={13} />
                          <span>+5 Questions</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Section / Round Name</label>
                        <input
                          type="text"
                          placeholder={`e.g. ${currentSection.name}: Core Concepts`}
                          value={customSections[activeSectionFilter]?.name || currentSection.name}
                          onChange={(e) => handleUpdateSectionMeta(activeSectionFilter, 'name', e.target.value)}
                          className="w-full border border-blue-200 rounded-xl px-3.5 py-2 text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Section Description / Syllabus</label>
                        <input
                          type="text"
                          placeholder="e.g. Topics covered in this assessment round..."
                          value={customSections[activeSectionFilter]?.description !== undefined ? customSections[activeSectionFilter].description : currentSection.description}
                          onChange={(e) => handleUpdateSectionMeta(activeSectionFilter, 'description', e.target.value)}
                          className="w-full border border-blue-200 rounded-xl px-3.5 py-2 text-xs font-medium bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Questions List for this Section */}
                  {currentSectionQuestions.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center space-y-3">
                      <FileSpreadsheet size={40} className="mx-auto text-slate-300" />
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-800">
                          No Questions Added for {secDisplayName} Yet
                        </h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Add one or multiple questions directly to this round.
                        </p>
                      </div>
                      <div className="flex justify-center items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleAddQuestion(activeSectionFilter, 1)}
                          className="px-4 py-2 bg-blue-600 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-sm inline-flex items-center space-x-1.5"
                        >
                          <Plus size={14} />
                          <span>Add 1 Question</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddQuestion(activeSectionFilter, 5)}
                          className="px-4 py-2 bg-indigo-600 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-sm inline-flex items-center space-x-1.5"
                        >
                          <Plus size={14} />
                          <span>Add 5 Questions</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        {currentSectionQuestions.map(q => renderQuestionCard(q, q.origIdx))}
                      </div>

                      {/* Prominent Add Question Buttons at Bottom of Section */}
                      <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => handleAddQuestion(activeSectionFilter, 1)}
                          className="flex-1 w-full py-3 border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700 font-extrabold rounded-2xl text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
                        >
                          <Plus size={15} />
                          <span>+ Add Another Question to {secDisplayName}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddQuestion(activeSectionFilter, 5)}
                          className="w-full sm:w-auto px-5 py-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-extrabold rounded-2xl text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
                        >
                          <Plus size={15} />
                          <span>+ Add 5 Questions</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* VIEW 2: ALL SECTIONS OVERVIEW (Grouped by Day/Round) */}
            {activeSectionFilter === 0 && (
              <div className="space-y-6">
                {sections.map(sec => {
                  const secQuestions = formData.questions
                    .map((q, origIdx) => ({ ...q, origIdx }))
                    .filter(q => (q.occurrence_number || 1) === sec.number);
                  const secTitle = customSections[sec.number]?.name || sec.name;
                  const secDesc = customSections[sec.number]?.description || sec.description;

                  return (
                    <div key={sec.number} className="border border-slate-200 bg-white rounded-3xl p-5 space-y-4 shadow-2xs">
                      {/* Section Card Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                            #{sec.number}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-black text-slate-900">{secTitle}</h4>
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold">
                                {secQuestions.length} {secQuestions.length === 1 ? 'Question' : 'Questions'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                              Scheduled Date: {sec.dateLabel} {secDesc ? `• ${secDesc}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setActiveSectionFilter(sec.number)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all"
                          >
                            Focus {sec.name}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddQuestion(sec.number, 1)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-xs cursor-pointer inline-flex items-center space-x-1 transition-all"
                          >
                            <Plus size={13} />
                            <span>Add Question</span>
                          </button>
                        </div>
                      </div>

                      {/* Section Questions */}
                      {secQuestions.length === 0 ? (
                        <div className="py-6 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                          <p className="text-xs text-slate-400 font-bold">No questions added for {secTitle} yet.</p>
                          <button
                            type="button"
                            onClick={() => handleAddQuestion(sec.number, 1)}
                            className="px-4 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-black cursor-pointer inline-flex items-center space-x-1"
                          >
                            <Plus size={13} />
                            <span>Add First Question to {secTitle}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {secQuestions.map(q => renderQuestionCard(q, q.origIdx))}

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleAddQuestion(sec.number, 1)}
                              className="flex-1 py-2.5 border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 text-blue-600 font-extrabold rounded-2xl text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
                            >
                              <Plus size={14} />
                              <span>+ Add Another Question to {secTitle}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddQuestion(sec.number, 5)}
                              className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-extrabold rounded-2xl text-xs cursor-pointer transition-all"
                            >
                              +5
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Step Navigation */}
            <div className="flex justify-between items-center pt-4 border-t">
              <button
                type="button"
                onClick={() => setActiveTab(1)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1 cursor-pointer transition-all"
              >
                <ArrowLeft size={16} />
                <span>Previous Step</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab(3)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center space-x-2 shadow-sm cursor-pointer transition-all"
              >
                <span>Next: Rules & Proctoring</span>
                <ArrowRight size={16} />
              </button>
            </div>

          </div>
        );
      })()}

      {/* ════════ TAB 3: RULES & PROCTORING ════════ */}
      {activeTab === 3 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b pb-2">Quiz Rules & Anti-Cheat Settings</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">Time Limit (Minutes)</label>
              <input
                type="number"
                value={formData.time_limit}
                onChange={e => setFormData({ ...formData, time_limit: parseInt(e.target.value, 10) })}
                className="w-full border rounded-xl px-3.5 py-2 text-xs font-bold bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">Max Attempts Per User</label>
              <select
                value={formData.max_attempts}
                onChange={e => setFormData({ ...formData, max_attempts: parseInt(e.target.value, 10) })}
                className="w-full border rounded-xl px-3.5 py-2 text-xs font-bold bg-white"
              >
                <option value={1}>1 Attempt (Default)</option>
                <option value={2}>2 Attempts</option>
                <option value={3}>3 Attempts</option>
                <option value={0}>Unlimited</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center space-x-3 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.shuffle_questions}
                onChange={e => setFormData({ ...formData, shuffle_questions: e.target.checked })}
                className="rounded text-blue-600 w-4 h-4"
              />
              <span>Shuffle Questions Order</span>
            </label>

            <label className="flex items-center space-x-3 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.shuffle_answers}
                onChange={e => setFormData({ ...formData, shuffle_answers: e.target.checked })}
                className="rounded text-blue-600 w-4 h-4"
              />
              <span>Shuffle Answer Options</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center space-x-3 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.require_fullscreen}
                onChange={e => setFormData({ ...formData, require_fullscreen: e.target.checked })}
                className="rounded text-blue-600 w-4 h-4"
              />
              <span>Require Fullscreen Mode</span>
            </label>

            <label className="flex items-center space-x-3 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.anti_cheat_enabled}
                onChange={e => setFormData({ ...formData, anti_cheat_enabled: e.target.checked })}
                className="rounded text-blue-600 w-4 h-4"
              />
              <span>Enable Anti-Cheat Detection</span>
            </label>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <button
              onClick={() => setActiveTab(2)}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1"
            >
              <ArrowLeft size={16} />
              <span>Previous Step</span>
            </button>

            <button
              onClick={() => setActiveTab(4)}
              className="px-6 py-2.5 bg-blue-600 text-white font-extrabold rounded-xl text-xs flex items-center space-x-2 shadow-sm"
            >
              <span>Next: Review & Publish</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ════════ TAB 4: REVIEW & PUBLISH ════════ */}
      {activeTab === 4 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs text-left">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b pb-2">Review Scheduled Quiz Configuration</h3>

          <div className="p-6 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-3 text-xs font-semibold text-slate-700">
            <div><strong>Title:</strong> {formData.title}</div>
            <div><strong>Schedule Pattern:</strong> {formData.schedule_type}</div>
            <div><strong>Date Window:</strong> {formData.start_date} to {formData.end_date}</div>
            <div><strong>Daily Time Window:</strong> {buildTimeString(formData.start_time_hh, formData.start_time_mm, formData.start_time_ss, formData.start_time_ampm)} to {buildTimeString(formData.end_time_hh, formData.end_time_mm, formData.end_time_ss, formData.end_time_ampm)} ({formData.timezone})</div>
            <div><strong>Total Questions:</strong> {formData.questions.length} Questions</div>
            <div><strong>Time Limit:</strong> {formData.time_limit} Mins</div>
            <div><strong>Proctoring:</strong> {formData.anti_cheat_enabled ? 'Anti-Cheat Enabled' : 'Standard'}</div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <button
              onClick={() => setActiveTab(3)}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1"
            >
              <ArrowLeft size={16} />
              <span>Previous Step</span>
            </button>

            <button
              onClick={handlePublishSubmit}
              disabled={saving}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer"
            >
              {saving ? 'Publishing...' : 'Publish Scheduled Quiz'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
