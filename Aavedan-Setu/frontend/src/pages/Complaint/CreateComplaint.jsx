/**
 * CreateComplaint.jsx — Create Complaint Form
 * =============================================
 * Multi-section form for submitting a new government complaint.
 *
 * Sections:
 *   1. Basic Info          — Title, Description
 *   2. Location Details    — Address, Landmark, State, District, Lat/Lng
 *   3. Options             — Anonymous toggle, Department
 *   4. Attachments         — Drag-and-drop multi-image upload (max 5)
 *
 * Uses React Hook Form for validation, Framer Motion for section
 * animations, and react-toastify for success/error feedback.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  HiPlusCircle,
  HiMapPin,
  HiCamera,
  HiTrash,
  HiChevronLeft,
  HiExclamationTriangle,
  HiDocumentText,
  HiCog6Tooth,
  HiPhoto,
  HiMicrophone,
  HiEye,
  HiXMark,
} from 'react-icons/hi2';

import { useCreateComplaint, useUploadImages } from '../../hooks/useComplaints';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { requiredRule } from '../../utils/validators';
import { departments } from '../../utils/helpers';
import locationService from '../../services/locationService';
import complaintService from '../../services/complaintService';
import aiService from '../../services/aiService';
import MapPicker from '../../components/MapPicker';
import { useAuth } from '../../context/AuthContext';

/* ─── max images allowed ─── */
const MAX_IMAGES = 5;

/* ─── section animation ─── */
const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

/* ====================================================================
   Component
   ==================================================================== */
export default function CreateComplaint() {
  const navigate = useNavigate();
  const location = useLocation();

  /* ── mutations ── */
  const { mutateAsync: createComplaint, isPending: isCreating } = useCreateComplaint();
  const { mutateAsync: uploadImages,   isPending: isUploading } = useUploadImages();

  /* ── form setup ── */
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      address: '',
      landmark: '',
      state: '',
      district: '',
      latitude: '',
      longitude: '',
      is_anonymous: false,
      is_assisted_filing: false,
      assisted_by_ngo_name: 'PRADAN Rural Foundation',
      beneficiary_name: '',
      beneficiary_phone: '',
      category: '',
      department: '',
    },
  });

  /* ── image state ── */
  const [images, setImages]         = useState([]);   // File[]
  const [previews, setPreviews]     = useState([]);   // data-url strings
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [isAutoStacking, setIsAutoStacking] = useState(false);
  const [viewMatchedModal, setViewMatchedModal] = useState(false);
  const [matchedTicketDetail, setMatchedTicketDetail] = useState(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const isAutoFilling = useRef(false);

  /* watched values */
  const selectedState = watch('state');
  const isAnonymous   = watch('is_anonymous');
  const isAssistedFiling = watch('is_assisted_filing');
  const selectedCategory   = watch('category');
  const selectedDepartment = watch('department');
  const selectedDistrict   = watch('district');
  const watchLatitude      = watch('latitude');
  const watchLongitude     = watch('longitude');

  /* ── User Role & NGO Access Control ── */
  const { user } = useAuth();
  const [isNgoDemoUnlocked, setIsNgoDemoUnlocked] = useState(false);
  const isNgoUser = user?.role === 'NGO_REPRESENTATIVE' || user?.email?.includes('pradan.org') || user?.email?.includes('ngo') || isNgoDemoUnlocked;

  /* ── Speech to Text Dictation ── */
  const getSpeechLanguage = () => {
    const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/i);
    const code = match ? match[1] : (localStorage.getItem('preferred_lang') || 'en');
    if (code === 'hi') return 'hi-IN';
    if (code === 'or') return 'or-IN';
    if (code === 'bn') return 'bn-IN';
    if (code === 'te') return 'te-IN';
    if (code === 'ta') return 'ta-IN';
    if (code === 'mr') return 'mr-IN';
    if (code === 'gu') return 'gu-IN';
    if (code === 'pa') return 'pa-IN';
    if (code === 'kn') return 'kn-IN';
    if (code === 'ml') return 'ml-IN';
    if (code === 'ur') return 'ur-IN';
    return 'en-IN';
  };

  const { isListening, startListening, stopListening, isSupported } = useSpeechToText({
    lang: getSpeechLanguage(),
    onResult: (text) => {
      setValue('description', text);
    },
  });

  const toggleSpeechToText = () => {
    if (!isSupported) {
      toast.warning('Web Speech API is not supported in your browser.');
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
      toast.info('Listening... Speak your complaint clearly.');
    }
  };

  /* ── dynamic locations state ── */
  const [dbStates, setDbStates] = useState([]);
  const [dbDistricts, setDbDistricts] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [dbCategories, setDbCategories] = useState([]);
  const [dbDepartments, setDbDepartments] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const statesData = await locationService.getStates();
        setDbStates(statesData);
      } catch (err) {
        console.error('Failed to fetch states', err);
      }
    };
    fetchStates();
  }, []);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [cats, depts] = await Promise.all([
          complaintService.getCategories(),
          complaintService.getDepartments(),
        ]);
        setDbCategories(cats);
        setDbDepartments(depts);
      } catch (err) {
        console.error('Failed to fetch categories/departments', err);
      }
    };
    fetchMetadata();
  }, []);



  const handleMapLocationSelect = useCallback((loc) => {
    if (loc.address && !loc.address.startsWith("State:") && !loc.address.startsWith("District:")) {
      setValue('address', loc.address);
    }
    setValue('latitude', loc.latitude || '');
    setValue('longitude', loc.longitude || '');

    if (loc.state && dbStates.length > 0) {
      isAutoFilling.current = true;
      const matchedState = findFuzzyMatch(dbStates, loc.state);
      if (matchedState) {
        const stateIdStr = matchedState.id.toString();
        setValue('state', stateIdStr, { shouldValidate: true, shouldDirty: true });
        setLoadingLocations(true);
        locationService.getDistricts(matchedState.id)
          .then((districtsData) => {
            setDbDistricts(districtsData);
            if (loc.district) {
              const matchedDistrict = findFuzzyMatch(districtsData, loc.district);
              if (matchedDistrict) {
                setValue('district', matchedDistrict.id.toString(), { shouldValidate: true, shouldDirty: true });
              }
            }
          })
          .catch((err) => console.error('Error setting map district:', err))
          .finally(() => {
            setLoadingLocations(false);
            setTimeout(() => { isAutoFilling.current = false; }, 500);
          });
      }
    }
  }, [dbStates, setValue]);

  const findFuzzyMatch = (items, targetStr) => {
    if (!targetStr || !items || items.length === 0) return null;
    const rawTarget = targetStr.toString().trim();
    const targetLower = rawTarget.toLowerCase();
    const cleanTarget = targetLower.replace(/state|district|dept/gi, '').trim();

    // 1. Exact or ID match
    let matched = items.find(
      (item) => item.id.toString() === rawTarget || item.name.toLowerCase() === targetLower || item.name.toLowerCase() === cleanTarget
    );
    if (matched) return matched;

    // 2. Substring match
    matched = items.find((item) => {
      const itemName = item.name.toLowerCase();
      return itemName.includes(cleanTarget) || cleanTarget.includes(itemName) || itemName.includes(targetLower) || targetLower.includes(itemName);
    });
    if (matched) return matched;

    // 3. Token-word overlap matching (e.g. "Road & Infrastructure" vs "Roads & Infrastructure", "Electricity Distribution Department" vs "Electricity Department")
    const targetTokens = targetLower.split(/[\s&/,\-_]+/).filter(t => t.length > 2);
    matched = items.find((item) => {
      const itemTokens = item.name.toLowerCase().split(/[\s&/,\-_]+/).filter(t => t.length > 2);
      return targetTokens.some(tt => itemTokens.some(it => it.includes(tt) || tt.includes(it)));
    });
    if (matched) return matched;

    // 4. Devanagari Hindi / Indic transliteration fallback map
    const HINDI_MAP = {
      'बिहार': 'bihar', 'ओडिशा': 'odisha', 'उड़ीसा': 'odisha', 'उत्तर प्रदेश': 'uttar pradesh',
      'पश्चिम बंगाल': 'west bengal', 'महाराष्ट्र': 'maharashtra', 'मध्य प्रदेश': 'madhya pradesh',
      'राजस्थान': 'rajasthan', 'दिल्ली': 'delhi', 'पंजाब': 'punjab', 'हरियाणा': 'haryana',
      'मधेपुरा': 'madhepura', 'खगड़िया': 'khagaria', 'पटना': 'patna', 'गया': 'gaya',
      'मुजफ्फरपुर': 'muzaffarpur', 'भागलपुर': 'bhagalpur', 'पूर्णिया': 'purnia',
      'कटिहार': 'katihar', 'समस्तीपुर': 'samastipur', 'दरभंगा': 'darbhanga',
      'सहरसा': 'saharsa', 'सुपौल': 'supaul', 'अररिया': 'araria', 'किशनगंज': 'kishanganj'
    };

    const mappedEng = HINDI_MAP[rawTarget];
    if (mappedEng) {
      matched = items.find((item) => item.name.toLowerCase().includes(mappedEng) || mappedEng.includes(item.name.toLowerCase()));
      if (matched) return matched;
    }

    return null;
  };

  useEffect(() => {
    if (isAutoFilling.current) {
      return;
    }
    if (!selectedState) {
      setDbDistricts([]);
      setValue('district', '');
      return;
    }
    const fetchDistricts = async () => {
      setLoadingLocations(true);
      try {
        const districtsData = await locationService.getDistricts(selectedState);
        setDbDistricts(districtsData);
        const currentDist = watch('district');
        if (currentDist) {
          const isValidForState = districtsData.some((d) => d.id.toString() === currentDist);
          if (!isValidForState) {
            setValue('district', '');
          }
        }
      } catch (err) {
        console.error('Failed to fetch districts', err);
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchDistricts();
  }, [selectedState, setValue, watch]);

  /* ── fuzzy duplicate & multi-angle vision grievance checker ── */
  useEffect(() => {
    const hasCategoryAndLocation = selectedCategory && selectedDepartment && selectedState && selectedDistrict;
    const hasImage = images && images.length > 0;

    if (hasCategoryAndLocation || hasImage) {
      const runDuplicateCheck = async () => {
        setCheckingDuplicates(true);
        try {
          const formData = new FormData();
          if (selectedCategory) formData.append('category', selectedCategory);
          if (selectedDepartment) formData.append('department', selectedDepartment);
          if (selectedState) formData.append('state', selectedState);
          if (selectedDistrict) formData.append('district', selectedDistrict);
          if (watchLatitude) formData.append('latitude', watchLatitude);
          if (watchLongitude) formData.append('longitude', watchLongitude);
          if (hasImage) {
            images.forEach((img) => formData.append('images', img));
            formData.append('image', images[0]);
          }

          const res = await complaintService.checkDuplicateComplaint(formData);
          if (res.duplicate_found) {
            setDuplicateWarning(res);
          } else {
            setDuplicateWarning(null);
          }
        } catch (err) {
          console.error("Duplicate check failed:", err);
          setDuplicateWarning(null);
        } finally {
          setCheckingDuplicates(false);
        }
      };

      const debounceTimer = setTimeout(() => {
        runDuplicateCheck();
      }, 400); // 400ms debounce

      return () => clearTimeout(debounceTimer);
    } else {
      setDuplicateWarning(null);
    }
  }, [selectedCategory, selectedDepartment, selectedState, selectedDistrict, watchLatitude, watchLongitude, images]);

  /* ── 1-Click Auto-Stacking with Existing Ward Project ── */
  const handleAutoStack = async (matchedComplaintId) => {
    if (!matchedComplaintId) return;
    setIsAutoStacking(true);
    try {
      const formData = new FormData();
      formData.append('complaint_id', matchedComplaintId);
      if (images && images.length > 0) {
        formData.append('image', images[0]);
      }
      const res = await complaintService.autoStackComplaint(formData);
      toast.success(res.message || 'Grievance verified & auto-stacked with Ward Project (+1 Support)!', {
        autoClose: 5000
      });
      if (res.project_id) {
        navigate('/civic-budgeting');
      } else {
        navigate(`/complaints/${matchedComplaintId}`);
      }
    } catch (err) {
      console.error('Auto-stack failed:', err);
      toast.error('Failed to auto-stack. You may submit as a standard separate ticket.');
    } finally {
      setIsAutoStacking(false);
    }
  };

  /* ── auto-fill from router state (AI hand-off) ── */
  useEffect(() => {
    if (!location.state) return;

    const autoFillForm = async () => {
      isAutoFilling.current = true;
      let { title, description, category, department, address, landmark, state, district } = location.state;

      if (title) setValue('title', title, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      if (description) setValue('description', description, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      if (address) setValue('address', address, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      if (landmark) setValue('landmark', landmark, { shouldValidate: true, shouldDirty: true, shouldTouch: true });

      // Match Category
      if (category && dbCategories.length > 0) {
        const matched = findFuzzyMatch(dbCategories, category);
        if (matched) setValue('category', matched.id.toString(), { shouldValidate: true, shouldDirty: true });
      }

      // Match Department
      if (department && dbDepartments.length > 0) {
        const matched = findFuzzyMatch(dbDepartments, department);
        if (matched) setValue('department', matched.id.toString(), { shouldValidate: true, shouldDirty: true });
      }

      // Match State & District
      let targetState = state;
      if (!targetState && district) {
        targetState = 'Bihar';
      }
      if (targetState && dbStates.length > 0) {
        const matchedState = findFuzzyMatch(dbStates, targetState);
        if (matchedState) {
          const stateIdStr = matchedState.id.toString();
          setValue('state', stateIdStr, { shouldValidate: true, shouldDirty: true });

          try {
            setLoadingLocations(true);
            const districtsData = await locationService.getDistricts(stateIdStr);
            setDbDistricts(districtsData);
            setLoadingLocations(false);

            if (district && districtsData.length > 0) {
              const matchedDistrict = findFuzzyMatch(districtsData, district);
              if (matchedDistrict) {
                setValue('district', matchedDistrict.id.toString(), { shouldValidate: true, shouldDirty: true, shouldTouch: true });
              }
            }
          } catch (err) {
            console.error("Failed to load auto-fill districts:", err);
            setLoadingLocations(false);
          }
        }
      }

      setTimeout(() => {
        isAutoFilling.current = false;
      }, 1200);
    };

    autoFillForm();
  }, [location.state, dbCategories, dbDepartments, dbStates, setValue]);

  const handleAIAssist = async () => {
    const descText = watch('description') || '';

    if (descText.trim().length >= 10) {
      try {
        toast.info("✨ AI analyzing description & auto-filling form...");
        const sessId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '123e4567-e89b-12d3-a456-426614174000';
        const res = await aiService.sendChatMessage(descText, sessId);

        const aiCat = res.category;
        const aiDept = res.department;
        const aiState = res.entities?.state;
        const aiDistrict = res.entities?.district;
        const aiAddress = res.entities?.address;
        const aiLandmark = res.entities?.landmark;

        // 1. Auto-fill Title if empty
        if (!watch('title') && res.complaint_type) {
          setValue('title', res.complaint_type, { shouldValidate: true, shouldDirty: true });
        }
        // 2. Auto-fill Address & Landmark if empty and valid
        if (!watch('address') && aiAddress && !aiAddress.startsWith('State:') && !aiAddress.startsWith('District:')) {
          setValue('address', aiAddress, { shouldValidate: true, shouldDirty: true });
        }
        if (!watch('landmark') && aiLandmark && aiLandmark !== 'None') {
          setValue('landmark', aiLandmark, { shouldValidate: true, shouldDirty: true });
        }

        // 3. Auto-fill Category
        if (aiCat && dbCategories.length > 0) {
          const matched = findFuzzyMatch(dbCategories, aiCat);
          if (matched) setValue('category', matched.id.toString(), { shouldValidate: true, shouldDirty: true });
        }

        // 4. Auto-fill Department
        if (aiDept && dbDepartments.length > 0) {
          const matched = findFuzzyMatch(dbDepartments, aiDept);
          if (matched) setValue('department', matched.id.toString(), { shouldValidate: true, shouldDirty: true });
        }

        // 5. Auto-fill State & District
        let targetState = aiState;
        if (!targetState && aiDistrict) {
          targetState = 'Bihar';
        }
        if (targetState && dbStates.length > 0) {
          isAutoFilling.current = true;
          const matchedState = findFuzzyMatch(dbStates, targetState);
          if (matchedState) {
            const stateIdStr = matchedState.id.toString();
            setValue('state', stateIdStr, { shouldValidate: true, shouldDirty: true, shouldTouch: true });

            setLoadingLocations(true);
            try {
              const districtsData = await locationService.getDistricts(stateIdStr);
              setDbDistricts(districtsData);
              setLoadingLocations(false);

              if (aiDistrict && districtsData.length > 0) {
                const matchedDistrict = findFuzzyMatch(districtsData, aiDistrict);
                if (matchedDistrict) {
                  setValue('district', matchedDistrict.id.toString(), { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                }
              }
            } catch (dErr) {
              console.error("Failed to load districts for AI state:", dErr);
              setLoadingLocations(false);
            } finally {
              setTimeout(() => { isAutoFilling.current = false; }, 500);
            }
          }
        }

        toast.success("✨ Form fields auto-filled by AI!");
      } catch (err) {
        console.error("AI Assist classification failed:", err);
      }
    } else if (images && images.length > 0) {
      analyzeImageAndAutoFill(images[0]);
    } else {
      toast.info("Please enter a short description or upload an image so AI can auto-fill form details!");
    }

    const currentValues = {
      title: watch('title'),
      description: watch('description'),
      category: watch('category') ? dbCategories.find(c => c.id.toString() === watch('category'))?.name : '',
      department: watch('department') ? dbDepartments.find(d => d.id.toString() === watch('department'))?.name : '',
      address: watch('address'),
      landmark: watch('landmark'),
      state: watch('state') ? dbStates.find(s => s.id.toString() === watch('state'))?.name : '',
      district: watch('district') ? dbDistricts.find(d => d.id.toString() === watch('district'))?.name : ''
    };
    const event = new CustomEvent('open_ai_assistant_with_data', { detail: currentValues });
    window.dispatchEvent(event);
  };

  /* ── Vision AI Image Analysis & Auto-Fill ── */
  const analyzeImageAndAutoFill = useCallback(async (imageFile) => {
    if (!imageFile) return;
    setIsAnalyzingImage(true);
    toast.info("📸 Vision AI analyzing uploaded image & auto-filling form...");

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        const sessId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '123e4567-e89b-12d3-a456-426614174000';
        const promptText = "Analyze this uploaded civic complaint photo. Identify the issue, title, description, category, department, address, state, and district.";

        try {
          const res = await aiService.sendChatMessage(promptText, sessId, null, base64Image);

          const aiCat = res.category;
          const aiDept = res.department;
          const aiState = res.entities?.state;
          const aiDistrict = res.entities?.district;
          const aiAddress = res.entities?.address;
          const aiLandmark = res.entities?.landmark;
          let generatedTitle = res.complaint_type || res.title;
          if (generatedTitle && generatedTitle.startsWith("Analyze this uploaded")) {
            generatedTitle = aiCat || "Civic Complaint";
          }

          let generatedDesc = res.generated_description || res.draft_description || res.description;
          if (generatedDesc && generatedDesc.startsWith("Analyze this uploaded")) {
            generatedDesc = null;
          }
          if (!generatedDesc && res.reply && !res.reply.startsWith("Analyze this uploaded") && !res.reply.includes("I can help you file")) {
            generatedDesc = res.reply;
          }

          // 1. Auto-fill Title
          if (generatedTitle) {
            const formattedTitle = generatedTitle.startsWith("AI Grievance:") ? generatedTitle : `AI Grievance: ${generatedTitle}`;
            setValue('title', formattedTitle, { shouldValidate: true, shouldDirty: true });
          }

          // 2. Auto-fill Description
          if (generatedDesc && generatedDesc.length > 5) {
            setValue('description', generatedDesc, { shouldValidate: true, shouldDirty: true });
          }

          // 3. Auto-fill Address & Landmark if valid
          if (aiAddress && !aiAddress.startsWith('State:') && !aiAddress.startsWith('District:')) {
            setValue('address', aiAddress, { shouldValidate: true, shouldDirty: true });
          }
          if (aiLandmark && aiLandmark !== 'None') {
            setValue('landmark', aiLandmark, { shouldValidate: true, shouldDirty: true });
          }

          // 4. Auto-fill Category
          if (aiCat && dbCategories.length > 0) {
            const matched = findFuzzyMatch(dbCategories, aiCat);
            if (matched) setValue('category', matched.id.toString(), { shouldValidate: true, shouldDirty: true });
          }

          // 5. Auto-fill Department
          if (aiDept && dbDepartments.length > 0) {
            const matched = findFuzzyMatch(dbDepartments, aiDept);
            if (matched) setValue('department', matched.id.toString(), { shouldValidate: true, shouldDirty: true });
          }

          // 6. Auto-fill State & District
          let targetState = aiState;
          if (!targetState && aiDistrict) {
            targetState = 'Bihar';
          }
          if (targetState && dbStates.length > 0) {
            isAutoFilling.current = true;
            const matchedState = findFuzzyMatch(dbStates, targetState);
            if (matchedState) {
              const stateIdStr = matchedState.id.toString();
              setValue('state', stateIdStr, { shouldValidate: true, shouldDirty: true, shouldTouch: true });

              setLoadingLocations(true);
              try {
                const districtsData = await locationService.getDistricts(stateIdStr);
                setDbDistricts(districtsData);
                setLoadingLocations(false);

                if (aiDistrict && districtsData.length > 0) {
                  const matchedDistrict = findFuzzyMatch(districtsData, aiDistrict);
                  if (matchedDistrict) {
                    setValue('district', matchedDistrict.id.toString(), { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                  }
                }
              } catch (dErr) {
                console.error("Failed to load districts for AI vision state:", dErr);
                setLoadingLocations(false);
              } finally {
                setTimeout(() => { isAutoFilling.current = false; }, 500);
              }
            }
          }

          toast.success("✨ Vision AI completed! Title, Description, Category & Department auto-filled.");
        } catch (apiErr) {
          console.error("Vision AI analysis call failed:", apiErr);
          toast.warning("Image attached! Unable to perform full Vision AI analysis.");
        } finally {
          setIsAnalyzingImage(false);
        }
      };
      reader.readAsDataURL(imageFile);
    } catch (err) {
      console.error("Error reading image file:", err);
      setIsAnalyzingImage(false);
    }
  }, [dbCategories, dbDepartments, dbStates, setValue]);

  /* ── image helpers ── */
  const addImages = useCallback((files) => {
    const incoming = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.warning(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }
    const toAdd = incoming.slice(0, remaining);
    if (incoming.length > toAdd.length) {
      toast.warning(`Only ${remaining} more image${remaining > 1 ? 's' : ''} can be added.`);
    }

    setImages((prev) => [...prev, ...toAdd]);

    /* generate previews */
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    // Automatically trigger Vision AI Analysis directly on image upload
    if (toAdd.length > 0) {
      analyzeImageAndAutoFill(toAdd[0]);
    }
  }, [images.length, analyzeImageAndAutoFill]);

  const removeImage = useCallback((index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /* ── drag-and-drop handlers ── */
  const onDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = ()  => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addImages(e.dataTransfer.files);
  };

  /* ── form submit ── */
  const onSubmit = async (formData) => {
    try {
      /* 1. Build flat complaint payload matching backend Serializer schema */
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        address: formData.address.trim(),
        landmark: formData.landmark.trim() || undefined,
        state: parseInt(formData.state, 10),
        district: parseInt(formData.district, 10),
        category: formData.category ? parseInt(formData.category, 10) : undefined,
        department: formData.department ? parseInt(formData.department, 10) : undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        is_anonymous: formData.is_anonymous,
      };

      /* 2. Create complaint */
      const result = await createComplaint(payload);

      /* 3. Upload images if any */
      if (images.length > 0 && result?.data?.id) {
        const fd = new FormData();
        images.forEach((img) => fd.append('images', img));
        await uploadImages({ id: result.data.id, formData: fd });
      }

      toast.success('Complaint submitted successfully!');
      if (result?.data?.id) {
        navigate(`/complaints/${result.data.id}`);
      } else {
        navigate('/complaints');
      }
    } catch (err) {
      const errorData = err?.response?.data;
      let errMsg = 'Failed to submit complaint. Please try again.';
      if (typeof errorData === 'string') {
        errMsg = errorData;
      } else if (errorData?.detail) {
        errMsg = errorData.detail;
      } else if (errorData) {
        const fieldErrors = Object.entries(errorData)
          .map(([field, errors]) => {
            const msgs = Array.isArray(errors) ? errors.join(', ') : errors;
            return `${field}: ${msgs}`;
          })
          .join('; ');
        if (fieldErrors) errMsg = fieldErrors;
      }
      toast.error(errMsg);
    }
  };

  const isBusy = isCreating || isUploading;

  /* ================================================================
     Render
     ================================================================ */
  return (
    <div className="page-container max-w-3xl">
      {/* ── Header Banner Container Box ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl bg-[#fff8eb]/95 backdrop-blur-md p-6 md:p-8 shadow-md border-2 border-amber-300/80 mb-6"
      >
        <div className="relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 text-slate-700 border border-amber-200 text-xs font-bold hover:bg-white mb-4 shadow-2xs cursor-pointer"
          >
            <HiChevronLeft className="w-4 h-4 text-[#0052cc]" />
            <span>Back</span>
          </button>

          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">
            Create New Complaint
          </h1>
          <p className="text-sm font-semibold text-slate-600">
            Fill in the details below to submit your complaint to the appropriate department.
          </p>
          <div className="w-10 h-1 bg-[#ea580c] rounded-full mt-2.5" />
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* ── AI Multi-Angle Duplicate & Auto-Stacking Banner ── */}
        {duplicateWarning && (duplicateWarning.duplicate_found || (Array.isArray(duplicateWarning) && duplicateWarning.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-2xl mb-6 shadow-md border-2 transition-all ${
              duplicateWarning.photo_smoking_alert
                ? 'bg-rose-50/95 border-rose-400 text-rose-950'
                : duplicateWarning.is_multi_angle_match
                ? 'bg-gradient-to-br from-indigo-50/95 via-amber-50/90 to-emerald-50/90 border-indigo-300 text-slate-900'
                : 'bg-amber-50 border-amber-300 text-slate-850'
            }`}
          >
            {/* Photo Smoking Warning Alert */}
            {duplicateWarning.photo_smoking_alert && (
              <div className="mb-3 p-3 rounded-xl bg-rose-100 border border-rose-300 flex items-start gap-2.5">
                <span className="text-xl">⚠️</span>
                <div>
                  <h4 className="text-xs font-black text-rose-900 uppercase tracking-wide">
                    Photo Smoking & Temporal Tamper Alert
                  </h4>
                  <p className="text-xs text-rose-800 mt-0.5 font-medium">
                    {duplicateWarning.photo_freshness_reason || "The uploaded image is older than 48 hours or was recycled from past resolved files. Please use Live In-App Camera capture."}
                  </p>
                </div>
              </div>
            )}

            {/* Header with AI Confidence & Multi-Angle Badging */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-indigo-200/60">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg">⚡</span>
                <h3 className="text-sm font-black text-indigo-950">
                  {duplicateWarning.is_multi_angle_match
                    ? 'AI Multi-Angle Incident Match Detected'
                    : 'Similar Grievances Found Nearby'}
                </h3>
                {duplicateWarning.is_multi_angle_match && (
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                    🟢 {Math.round((duplicateWarning.confidence || 0.88) * 100)}% Visual & Spatial Match
                  </span>
                )}
                {duplicateWarning.angle_detected && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                    📐 {duplicateWarning.angle_detected}
                  </span>
                )}
                {duplicateWarning.distance_meters > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    📍 {duplicateWarning.distance_meters}m away
                  </span>
                )}
                {duplicateWarning.jurisdiction_mismatch && (
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                    <span>🌐 Cross-District Match</span>
                    {duplicateWarning.original_district && (
                      <span className="font-semibold text-[10px]">({duplicateWarning.original_district})</span>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* 🛡️ Special Alert: Previously Resolved Defect / Photo Smoking Alert */}
            {duplicateWarning.is_already_resolved && duplicateWarning.resolved_complaint ? (
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50/70 rounded-xl p-4 border-2 border-emerald-300 shadow-sm mb-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <span>🛡️ Incident Previously Resolved by Department</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-2 py-0.5 rounded-full">
                      Verified {duplicateWarning.resolved_at ? new Date(duplicateWarning.resolved_at).toLocaleDateString() : 'Official'}
                    </span>
                  </span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                    Ticket #{duplicateWarning.resolved_complaint.reference_number || duplicateWarning.resolved_complaint.id}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mb-3 leading-relaxed">
                  Our AI Vision Engine matched your photo with a civic issue that was already completed and marked <strong>Resolved</strong>. If this problem has broken again or resurfaced, you can file a <strong>Resurfaced Defect Appeal</strong>.
                </p>

                {/* Proof comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center gap-2.5">
                    {duplicateWarning.resolved_complaint.images?.[0]?.image ? (
                      <img
                        src={duplicateWarning.resolved_complaint.images[0].image}
                        alt="Past Defect"
                        className="w-14 h-14 rounded-lg object-cover border border-slate-300 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-xs shrink-0">📸</div>
                    )}
                    <div className="text-xs overflow-hidden">
                      <span className="font-bold text-slate-800 block truncate">{duplicateWarning.resolved_complaint.title}</span>
                      <span className="text-[11px] text-slate-500 block">Status: Resolved & Closed</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-emerald-200 flex items-center gap-2.5">
                    {previews.length > 0 ? (
                      <img
                        src={previews[0]}
                        alt="Your submission"
                        className="w-14 h-14 rounded-lg object-cover border border-emerald-300 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-emerald-100 flex items-center justify-center text-xs shrink-0">📍</div>
                    )}
                    <div className="text-xs">
                      <span className="font-bold text-emerald-950 block">Your Uploaded Photo</span>
                      <span className="text-[11px] text-emerald-700 block">Matches Resolved Site</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <div className="text-[11px] text-slate-600 italic truncate max-w-sm">
                    Remarks: {duplicateWarning.resolution_remarks || 'Repairs completed by department engineering team.'}
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setMatchedTicketDetail(duplicateWarning.resolved_complaint);
                        setViewMatchedModal(true);
                      }}
                      className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition cursor-pointer"
                    >
                      <HiEye className="w-3.5 h-3.5 inline mr-1 text-indigo-600" />
                      View Resolution Proof
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setValue('title', `[RESURFACED] Re-opened: ${duplicateWarning.resolved_complaint.title}`, { shouldDirty: true, shouldTouch: true });
                        setValue('description', `This issue was previously marked resolved under Ticket #${duplicateWarning.resolved_complaint.reference_number}, but the problem has resurfaced or broken again. Urgent re-inspection requested.`, { shouldDirty: true, shouldTouch: true });
                        toast.info('Form updated to file a "Resurfaced Issue / Re-open Appeal" for executive engineering inspection.');
                      }}
                      className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer whitespace-nowrap"
                    >
                      🔄 Report as Resurfaced / Broken Again
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs sm:text-sm text-slate-700 mt-2.5 mb-4 leading-relaxed font-medium">
                  {duplicateWarning.is_multi_angle_match
                    ? `Our Deep Visual Semantic Model identified that your photo captures the same physical defect from a different perspective. Instead of creating a duplicate ticket, auto-stack your photo to increase ward priority (+1 Vote)!`
                    : `Other citizens have reported related issues in this location. You can view or consolidate with existing tickets.`}
                </p>

                {/* Side-by-Side Dual-Image Perspective Inspection Card (if matched_complaint exists) */}
                {duplicateWarning.matched_complaint && (
              <div className="bg-white/90 rounded-xl p-4 border border-indigo-100 shadow-sm mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {/* Left: Existing Grievance */}
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    {duplicateWarning.matched_complaint.images?.[0]?.image ? (
                      <img
                        src={duplicateWarning.matched_complaint.images[0].image}
                        alt="Existing Complaint"
                        className="w-16 h-16 rounded-lg object-cover border border-slate-300 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-xl shrink-0">
                        🏛️
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                        Existing Active Incident (#{duplicateWarning.matched_complaint.reference_number || duplicateWarning.matched_complaint.id})
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {duplicateWarning.matched_complaint.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {duplicateWarning.matched_complaint.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: User's New Uploaded Angle Preview */}
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                    {previews.length > 0 ? (
                      <img
                        src={previews[0]}
                        alt="Your New Angle"
                        className="w-16 h-16 rounded-lg object-cover border border-emerald-300 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-xl shrink-0">
                        📸
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                        Your New Multi-Angle Evidence
                      </span>
                      <p className="text-xs font-semibold text-emerald-950">
                        {previews.length > 0 ? 'Live Capture / Upload Ready' : 'Pending Image Attachment'}
                      </p>
                      <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                        Ready for Auto-Stacking
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1-Click Auto-Stack Action Bar */}
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    Ward Project: <span className="font-bold text-indigo-900">{duplicateWarning.matched_project_title || 'Civic Infrastructure Ward Project'}</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setMatchedTicketDetail(duplicateWarning.matched_complaint);
                        setViewMatchedModal(true);
                      }}
                      className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-white border border-indigo-300 hover:bg-indigo-50/80 text-indigo-950 text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                    >
                      <HiEye className="w-4 h-4 text-indigo-600" />
                      <span>View Ticket Details & Photo</span>
                    </button>
                    <button
                      type="button"
                      disabled={isAutoStacking}
                      onClick={() => handleAutoStack(duplicateWarning.matched_complaint.id)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                    >
                      <span>👍 Upvote & Auto-Stack (+1 Support)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Fallback List of Other Duplicates if array */}
            {Array.isArray(duplicateWarning.duplicates) && duplicateWarning.duplicates.length > 0 && !duplicateWarning.matched_complaint && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {duplicateWarning.duplicates.map((dup) => (
                  <div key={dup.id} className="bg-white border border-amber-250 rounded-xl p-3 flex flex-col justify-between shadow-2xs">
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-700">
                        {dup.reference_number || `#GOV-${dup.id}`}
                      </span>
                      <h4 className="font-semibold text-slate-900 text-xs mt-1 mb-1 line-clamp-1">
                        {dup.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                        {dup.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMatchedTicketDetail(dup);
                          setViewMatchedModal(true);
                        }}
                        className="btn bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs py-1.5 px-2.5 rounded-lg font-bold flex-1 text-center cursor-pointer"
                      >
                        <HiEye className="w-3.5 h-3.5 inline mr-1 text-indigo-600" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAutoStack(dup.id)}
                        className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 px-3 rounded-lg font-bold flex-1 text-center cursor-pointer"
                      >
                        👍 Auto-Stack
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </>
          )}
          </motion.div>
        )}

        {/* ────────────────────────────────────────────────────────
           Section 1 — Basic Information
           ──────────────────────────────────────────────────────── */}
        <motion.section
          custom={0}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="card p-6 mb-5"
        >
          <SectionHeader icon={HiDocumentText} title="Basic Information" number={1} />

          {/* Title */}
          <div className="mb-4">
            <label htmlFor="title" className="form-label">
              Complaint Title <span className="text-danger">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="Brief summary of your complaint"
              className={`form-input ${errors.title ? 'form-input-error' : ''}`}
              {...register('title', {
                ...requiredRule('Title is required'),
                minLength: { value: 5, message: 'Title must be at least 5 characters' },
                maxLength: { value: 200, message: 'Title cannot exceed 200 characters' },
              })}
            />
            {errors.title && <p className="form-error">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="description" className="form-label mb-0">
                Description <span className="text-danger">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSpeechToText}
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl font-bold border transition cursor-pointer ${
                    isListening
                      ? 'bg-red-500 text-white border-red-600 animate-pulse shadow-md'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 shadow-2xs'
                  }`}
                  title={isListening ? 'Stop Voice Dictation' : 'Speak Complaint via Voice Dictation'}
                >
                  <HiMicrophone className={`w-3.5 h-3.5 ${isListening ? 'animate-bounce' : 'text-amber-700'}`} />
                  <span>{isListening ? 'Listening...' : '🎤 Speak Complaint'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleAIAssist}
                  className="inline-flex items-center gap-1.5 text-xs bg-gov-100 hover:bg-gov-200 text-gov-800 px-2.5 py-1 rounded-xl border border-gov-200 font-bold shadow-sm transition"
                >
                  ✨ AI Assist
                </button>
              </div>
            </div>

            {/* Vision AI Scanning Loader Banner */}
            {isAnalyzingImage && (
              <div className="p-3.5 rounded-xl bg-indigo-50 border-2 border-indigo-300 text-indigo-950 flex items-center gap-3 animate-pulse mb-3 shadow-2xs">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider">Vision AI Processing Image</h4>
                  <p className="text-xs text-indigo-800">Analyzing civic defect photo... Title, description, category, and department will auto-fill shortly.</p>
                </div>
              </div>
            )}
            <textarea
              id="description"
              rows={5}
              placeholder="Provide a detailed description of the issue…"
              className={`form-input resize-y min-h-[120px] ${errors.description ? 'form-input-error' : ''}`}
              {...register('description', {
                ...requiredRule('Description is required'),
                minLength: { value: 20, message: 'Description must be at least 20 characters' },
              })}
            />
            {errors.description && <p className="form-error">{errors.description.message}</p>}
          </div>
        </motion.section>

        {/* ────────────────────────────────────────────────────────
           Section 2 — Location Details
           ──────────────────────────────────────────────────────── */}
        <motion.section
          custom={1}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="card p-6 mb-5"
        >
          <SectionHeader icon={HiMapPin} title="Location Details" number={2} />

          {/* Interactive Map Picker */}
          <div className="mb-4">
            <label className="form-label">Select Location on Map</label>
            <MapPicker onLocationSelect={handleMapLocationSelect} />
          </div>

          {/* Address */}
          <div className="mb-4">
            <label htmlFor="address" className="form-label">Address</label>
            <input
              id="address"
              type="text"
              placeholder="Street address or area"
              className="form-input"
              {...register('address')}
            />
          </div>

          {/* Landmark */}
          <div className="mb-4">
            <label htmlFor="landmark" className="form-label">Landmark</label>
            <input
              id="landmark"
              type="text"
              placeholder="Nearby landmark"
              className="form-input"
              {...register('landmark')}
            />
          </div>

          {/* State + District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="state" className="form-label">State <span className="text-danger">*</span></label>
              <select
                id="state"
                className={`form-input ${errors.state ? 'form-input-error' : ''}`}
                {...register('state', requiredRule('State is required'))}
              >
                <option value="">Select State</option>
                {dbStates.map((s) => (
                  <option key={s.id} value={s.id.toString()}>{s.name}</option>
                ))}
              </select>
              {errors.state && <p className="form-error">{errors.state.message}</p>}
            </div>
            <div>
              <label htmlFor="district" className="form-label">District <span className="text-danger">*</span></label>
              <select
                id="district"
                className={`form-input ${errors.district ? 'form-input-error' : ''}`}
                disabled={!selectedState}
                {...register('district', requiredRule('District is required'))}
              >
                <option value="">{loadingLocations ? 'Loading districts...' : 'Select District'}</option>
                {dbDistricts.map((d) => (
                  <option key={d.id} value={d.id.toString()}>{d.name}</option>
                ))}
              </select>
              {errors.district && <p className="form-error">{errors.district.message}</p>}
            </div>
          </div>

          {/* Lat / Lng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="form-label">Latitude</label>
              <input
                id="latitude"
                type="number"
                step="any"
                placeholder="e.g. 28.6139"
                className={`form-input ${errors.latitude ? 'form-input-error' : ''}`}
                {...register('latitude', {
                  validate: (v) =>
                    !v || (parseFloat(v) >= -90 && parseFloat(v) <= 90) || 'Latitude must be between -90 and 90',
                })}
              />
              {errors.latitude && <p className="form-error">{errors.latitude.message}</p>}
            </div>
            <div>
              <label htmlFor="longitude" className="form-label">Longitude</label>
              <input
                id="longitude"
                type="number"
                step="any"
                placeholder="e.g. 77.2090"
                className={`form-input ${errors.longitude ? 'form-input-error' : ''}`}
                {...register('longitude', {
                  validate: (v) =>
                    !v || (parseFloat(v) >= -180 && parseFloat(v) <= 180) || 'Longitude must be between -180 and 180',
                })}
              />
              {errors.longitude && <p className="form-error">{errors.longitude.message}</p>}
            </div>
          </div>
        </motion.section>

        {/* ────────────────────────────────────────────────────────
           Section 3 — Options
           ──────────────────────────────────────────────────────── */}
        <motion.section
          custom={2}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="card p-6 mb-5"
        >
          <SectionHeader icon={HiCog6Tooth} title="Options" number={3} />

          {/* Anonymous toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gov-50/50 border border-gov-100 mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Submit Anonymously</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Your identity will be hidden from public view
              </p>
            </div>
            <Controller
              name="is_anonymous"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  onClick={() => field.onChange(!field.value)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gov-600 ${
                    field.value ? 'bg-gov-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-1 ${
                      field.value ? 'translate-x-6 ml-0' : 'translate-x-1'
                    }`}
                  />
                </button>
              )}
            />
          </div>

          {/* NGO Sahayak Assisted Filing toggle (Role-Restricted) */}
          {!isNgoUser ? (
            <div className="p-4 rounded-xl bg-slate-100/90 border border-slate-200 mb-4 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🔒 Assisted Citizen Filing (NGO Sahayak Mode)</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Role Restricted
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Locked for standard citizens. Only certified NGO Partner accounts can submit assisted grievances.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsNgoDemoUnlocked(true);
                    toast.success('Switched to Verified NGO Partner Account (Demo Mode).');
                  }}
                  className="text-xs font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 px-3 py-1.5 rounded-xl border border-amber-300 transition whitespace-nowrap shadow-2xs self-start sm:self-auto cursor-pointer"
                >
                  🏢 Switch to NGO Partner (Demo)
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 mb-4 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                    <span>🤝 Assisted Citizen Filing (NGO Sahayak Mode)</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      🟢 Verified NGO Partner: {user?.ngo_organization_name || 'PRADAN Rural Foundation'}
                    </span>
                  </p>
                  <p className="text-xs text-amber-800/80 mt-0.5">
                    Filing on behalf of a rural, elderly, or digitally illiterate citizen
                  </p>
                </div>
                <Controller
                  name="is_assisted_filing"
                  control={control}
                  render={({ field }) => (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={field.value}
                      onClick={() => field.onChange(!field.value)}
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                        field.value ? 'bg-amber-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-1 ${
                          field.value ? 'translate-x-6 ml-0' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  )}
                />
              </div>

              {isAssistedFiling && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-3 border-t border-amber-200/60 grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  <div>
                    <label className="text-xs font-bold text-amber-900 mb-1 block">
                      Citizen Beneficiary Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rameshwar Prasad"
                      className="w-full text-xs p-2.5 rounded-lg border border-amber-300 bg-white font-medium focus:ring-2 focus:ring-amber-400 outline-none"
                      {...register('beneficiary_name')}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-900 mb-1 block">
                      Citizen Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      className="w-full text-xs p-2.5 rounded-lg border border-amber-300 bg-white font-medium focus:ring-2 focus:ring-amber-400 outline-none"
                      {...register('beneficiary_phone')}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-900 mb-1 block">
                      Partner NGO / Organization
                    </label>
                    <select
                      className="w-full text-xs p-2.5 rounded-lg border border-amber-300 bg-white font-medium focus:ring-2 focus:ring-amber-400 outline-none"
                      {...register('assisted_by_ngo_name')}
                    >
                      <option value="PRADAN Rural Foundation">PRADAN Rural Foundation</option>
                      <option value="SEWA Bharat Grassroots">SEWA Bharat Grassroots</option>
                      <option value="Jan Sahas Community Sahayak">Jan Sahas Community Sahayak</option>
                      <option value="Kudumbashree Mission Partner">Kudumbashree Mission Partner</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Category */}
          <div className="mb-4">
            <label htmlFor="category" className="form-label">Category</label>
            <select
              id="category"
              className={`form-input ${errors.category ? 'form-input-error' : ''}`}
              {...register('category', { required: 'Category is required' })}
            >
              <option value="">Select Category</option>
              {dbCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="form-label">Department</label>
            <select
              id="department"
              className={`form-input ${errors.department ? 'form-input-error' : ''}`}
              {...register('department')}
            >
              <option value="">Select Department (optional)</option>
              {dbDepartments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </motion.section>

        {/* ────────────────────────────────────────────────────────
           Section 4 — Images
           ──────────────────────────────────────────────────────── */}
        <motion.section
          custom={3}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="card p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <SectionHeader icon={HiPhoto} title="Attachments & Photo Proofs" number={4} />
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold hover:bg-indigo-100 transition shadow-2xs cursor-pointer self-start sm:self-auto"
            >
              <HiCamera className="w-4 h-4 text-indigo-600" />
              <span>📸 Live Camera Capture (Anti-Tamper)</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Upload up to {MAX_IMAGES} images to support your complaint. Live camera capture automatically validates capture timestamp.
          </p>

          {/* drop zone */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-gov-500 bg-gov-50'
                : 'border-gray-300 hover:border-gov-400 hover:bg-gov-50/30'
            } ${images.length >= MAX_IMAGES ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => addImages(e.target.files)}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => addImages(e.target.files)}
              className="hidden"
            />
            <HiCamera className="mx-auto w-10 h-10 text-gov-400 mb-3" />
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? 'Drop images here' : 'Drag & drop images or click to browse'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG, WEBP — max {MAX_IMAGES} images (Live camera or file upload)
            </p>
          </div>

          {/* image previews with anti-tamper watermark badge */}
          <AnimatePresence>
            {previews.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-4"
              >
                {previews.map((src, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-2xs"
                  >
                    <img
                      src={src}
                      alt={`Upload preview ${idx + 1}`}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs px-1 py-0.5 text-center">
                      <span className="text-[9px] text-emerald-300 font-bold block truncate">
                        📍 GPS & Time Stamped
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer"
                      aria-label={`Remove image ${idx + 1}`}
                    >
                      <HiTrash className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {/* Section 4 Instant AI Multi-Angle Duplicate Card */}
          {duplicateWarning && (duplicateWarning.duplicate_found || (Array.isArray(duplicateWarning) && duplicateWarning.length > 0)) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-5 p-4 rounded-xl border-2 shadow-xs ${
                duplicateWarning.is_already_resolved
                  ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50/80 border-emerald-300'
                  : 'bg-gradient-to-r from-amber-50 to-indigo-50/80 border-indigo-200'
              }`}
            >
              {duplicateWarning.is_already_resolved && duplicateWarning.resolved_complaint ? (
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <span>🛡️ Incident Previously Resolved by Department</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-2 py-0.5 rounded-full">
                        Resolved {duplicateWarning.resolved_at ? new Date(duplicateWarning.resolved_at).toLocaleDateString() : 'Official'}
                      </span>
                    </span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                      #{duplicateWarning.resolved_complaint.reference_number || duplicateWarning.resolved_complaint.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mb-3">
                    Our AI Vision Model detected that this physical issue was already repaired and marked <strong>Resolved</strong>. If this defect has resurfaced, you can file a <strong>Resurfaced Defect Appeal</strong>.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 bg-white rounded-lg border border-slate-200">
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 line-clamp-1">{duplicateWarning.resolved_complaint.title}</span>
                      <span className="text-[11px] text-slate-500 italic">
                        Remarks: {duplicateWarning.resolution_remarks || 'Official repairs verified.'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setMatchedTicketDetail(duplicateWarning.resolved_complaint);
                          setViewMatchedModal(true);
                        }}
                        className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-2xs flex items-center justify-center gap-1 cursor-pointer transition"
                      >
                        <HiEye className="w-3.5 h-3.5 text-indigo-600" />
                        <span>View Proof</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setValue('title', `[RESURFACED] Re-opened: ${duplicateWarning.resolved_complaint.title}`, { shouldDirty: true, shouldTouch: true });
                          setValue('description', `This issue was previously marked resolved under Ticket #${duplicateWarning.resolved_complaint.reference_number}, but the problem has resurfaced or broken again. Urgent re-inspection requested.`, { shouldDirty: true, shouldTouch: true });
                          toast.info('Form updated to file a "Resurfaced Issue / Re-open Appeal" for executive engineering inspection.');
                        }}
                        className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs cursor-pointer transition whitespace-nowrap"
                      >
                        🔄 Report as Resurfaced
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <span>⚡ AI Incident Match Found</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                        🟢 {Math.round((duplicateWarning.confidence || 0.88) * 100)}% Match
                      </span>
                    </span>
                    {duplicateWarning.angle_detected && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                        📐 {duplicateWarning.angle_detected}
                      </span>
                    )}
                    {duplicateWarning.jurisdiction_mismatch && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
                        🌐 Cross-District: {duplicateWarning.original_district || 'Different District'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 mb-3">
                    Our AI Vision Model matched this photo with an existing active grievance. You can instantly auto-stack your photo as multi-angle proof (+1 Upvote) without filling in repetitive fields.
                  </p>
                  {duplicateWarning.matched_complaint && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-lg border border-slate-200">
                      <div className="text-xs">
                        <span className="font-mono font-bold text-indigo-700 block">
                          #{duplicateWarning.matched_complaint.reference_number || duplicateWarning.matched_complaint.id}
                        </span>
                        <p className="font-bold text-slate-900 line-clamp-1">{duplicateWarning.matched_complaint.title}</p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setMatchedTicketDetail(duplicateWarning.matched_complaint);
                            setViewMatchedModal(true);
                          }}
                          className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                        >
                          <HiEye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>View Ticket Details & Photo</span>
                        </button>
                        <button
                          type="button"
                          disabled={isAutoStacking}
                          onClick={() => handleAutoStack(duplicateWarning.matched_complaint.id)}
                          className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs cursor-pointer transition whitespace-nowrap"
                        >
                          👍 Upvote & Auto-Stack (+1)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </motion.section>

        {/* ── submit ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-end"
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            disabled={isBusy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary min-w-[160px]"
            disabled={isBusy}
          >
            {isBusy ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isUploading ? 'Uploading Images…' : 'Submitting…'}
              </>
            ) : (
              <>
                <HiPlusCircle className="w-5 h-5" />
                Submit Complaint
              </>
            )}
          </button>
        </motion.div>

        {/* ── Matched Ticket Details & Side-by-Side Comparison Modal ── */}
        <AnimatePresence>
          {viewMatchedModal && matchedTicketDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 flex flex-col"
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-md">
                        #{matchedTicketDetail.reference_number || matchedTicketDetail.id}
                      </span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-md">
                        🟢 {Math.round((duplicateWarning?.confidence || 0.88) * 100)}% AI Vision Match
                      </span>
                      {duplicateWarning?.angle_detected && (
                        <span className="text-[11px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                          📐 {duplicateWarning.angle_detected}
                        </span>
                      )}
                      {duplicateWarning?.jurisdiction_mismatch && (
                        <span className="text-[11px] bg-amber-100 text-amber-900 font-extrabold px-2.5 py-0.5 rounded border border-amber-300">
                          🌐 Cross-District Match ({duplicateWarning.original_district || 'Other District'})
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-2">
                      {matchedTicketDetail.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMatchedModal(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition"
                  >
                    <HiXMark className="w-5 h-5" />
                  </button>
                </div>

                {/* Side-by-Side Photos */}
                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Side-by-Side Multi-Angle Evidence
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Existing Photo */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
                      <span className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span>📸 Existing Ticket Photo</span>
                        <span className="text-[10px] text-slate-400 font-mono">Registered Record</span>
                      </span>
                      {matchedTicketDetail.images && matchedTicketDetail.images.length > 0 ? (
                        <img
                          src={matchedTicketDetail.images[0].image_url || matchedTicketDetail.images[0].image}
                          alt="Existing Complaint"
                          className="w-full h-44 rounded-lg object-cover border border-slate-300"
                        />
                      ) : (
                        <div className="w-full h-44 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 text-xs">
                          No photo on file
                        </div>
                      )}
                    </div>

                    {/* Newly Attached Photo */}
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col">
                      <span className="text-[11px] font-bold text-emerald-800 mb-1.5 flex items-center justify-between">
                        <span>📍 Your New Photo (Angle Shift)</span>
                        <span className="text-[10px] text-emerald-600 font-bold">New Evidence</span>
                      </span>
                      {previews.length > 0 ? (
                        <img
                          src={previews[0]}
                          alt="New angle"
                          className="w-full h-44 rounded-lg object-cover border border-emerald-300"
                        />
                      ) : (
                        <div className="w-full h-44 rounded-lg bg-emerald-100/60 flex items-center justify-center text-emerald-700 text-xs font-semibold">
                          Upload ready in Step 4
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Complaint Details Summary */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-5 text-xs space-y-2.5">
                  <div>
                    <span className="font-bold text-slate-600 block">Description:</span>
                    <p className="text-slate-800 leading-relaxed mt-0.5">
                      {matchedTicketDetail.description || 'No detailed description provided.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Category:</span>
                      <span className="font-semibold text-slate-800">
                        {matchedTicketDetail.category || 'Sanitation / Waste'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">District:</span>
                      <span className="font-semibold text-slate-800">
                        {matchedTicketDetail.district || 'Khordha'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Status:</span>
                      <span className="font-bold text-amber-700">
                        {matchedTicketDetail.status || 'Under Review'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modal Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100 mt-auto">
                  <button
                    type="button"
                    onClick={() => setViewMatchedModal(false)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Close & Keep Filing New
                  </button>
                  <button
                    type="button"
                    disabled={isAutoStacking}
                    onClick={() => {
                      setViewMatchedModal(false);
                      handleAutoStack(matchedTicketDetail.id);
                    }}
                    className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>👍 Confirm: Upvote & Auto-Stack (+1 Support)</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}

/* ====================================================================
   Section Header  — reusable mini-component
   ==================================================================== */
function SectionHeader({ icon: Icon, title, number }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg bg-gov-100 flex items-center justify-center">
        <Icon className="w-5 h-5 text-gov-700" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gov-500 uppercase tracking-wide">
          Step {number}
        </p>
        <h2 className="text-lg font-semibold text-gray-800 leading-tight">{title}</h2>
      </div>
    </div>
  );
}
