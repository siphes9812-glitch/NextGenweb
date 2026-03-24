/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Laptop, 
  Globe, 
  Headset, 
  Briefcase, 
  Phone, 
  Mail, 
  MapPin,
  MessageCircle, 
  ShieldCheck, 
  Code, 
  Server,
  CheckCircle2,
  Target,
  History,
  Heart,
  Users,
  Palette,
  Check,
  ShoppingCart,
  ArrowRight,
  Sun,
  Moon,
  HelpCircle,
  ChevronDown,
  Activity,
  Search,
  Settings,
  Zap,
  Star,
  LogOut,
  ClipboardList,
  Clock,
  AlertCircle,
  Eye,
  Trash2,
  Filter,
  Loader2,
  User,
  Pencil,
  X,
  Send
} from "lucide-react";
import { Chatbot } from "./components/Chatbot";
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  updatePassword,
  updateProfile,
  deleteAuthUser,
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  deleteDoc, 
  Timestamp,
  FirebaseUser,
  firebaseConfig
} from "./firebase";
import { ErrorBoundary } from "./components/ErrorBoundary";

// --- Types ---
interface Quote {
  id: string;
  customerName: string;
  customerEmail: string;
  serviceType: string;
  message: string;
  status: 'pending' | 'reviewed' | 'completed';
  createdAt: any;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'client';
  createdAt?: any;
}

const services = [
  {
    title: "Technical Support",
    icon: <Laptop className="w-6 h-6" />,
    color: "bg-brand-blue",
    lightColor: "bg-blue-50",
    textColor: "text-blue-600",
    items: [
      { name: "Computer Repair (Hardware & Software)", price: "R300 - R800" },
      { name: "Laptop & Desktop Troubleshooting", price: "R250 - R500" },
      { name: "Virus & Malware Removal", price: "R200 - R450" },
      { name: "System Upgrades (RAM/SSD Installation)", price: "R150 - R350" },
      { name: "Basic PC Clean & Speed Boost", price: "R250" },
      { name: "Full System Service", price: "R450" },
      { name: "Monthly IT Support (Small Business)", price: "From R1,000/mo" }
    ]
  },
  {
    title: "Web & Online Services",
    icon: <Globe className="w-6 h-6" />,
    color: "bg-indigo-600",
    lightColor: "bg-indigo-50",
    textColor: "text-indigo-600",
    items: [
      { name: "Website Design & Development", price: "R1,500 - R5,000" },
      { name: "Domain Registration & Hosting Setup", price: "R500 - R1,200" }
    ]
  },
  {
    title: "IT Support Services",
    icon: <Headset className="w-6 h-6" />,
    color: "bg-teal-600",
    lightColor: "bg-teal-50",
    textColor: "text-teal-600",
    items: [
      { name: "Remote Support", price: "R150/sess | R300/hr" },
      { name: "On-site Support", price: "R350 - R600/visit" }
    ]
  },
  {
    title: "Business Solutions",
    icon: <Briefcase className="w-6 h-6" />,
    color: "bg-slate-800",
    lightColor: "bg-slate-50",
    textColor: "text-slate-800",
    items: [
      { name: "Microsoft 365 Setup & Configuration", price: "R500 - R1,200" },
      { name: "Antivirus Installation", price: "R150 - R300" },
      { name: "IT Consulting", price: "R300 - R700/sess" }
    ]
  },
  {
    title: "Design & Templates",
    icon: <Palette className="w-6 h-6" />,
    color: "bg-rose-600",
    lightColor: "bg-rose-50",
    textColor: "text-rose-600",
    items: [
      { name: "Poster Design", price: "Quote" },
      { name: "Invoice Templates", price: "Quote" },
      { name: "Letterhead Templates", price: "Quote" },
      { name: "Quotation Templates", price: "Quote" }
    ]
  }
];

export default function App() {
  const [selectedItems, setSelectedItems] = useState<{ name: string; price: string }[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Auth & Admin State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [view, setView] = useState<'home' | 'admin' | 'login'>('home');
  
  // Quote Modal State
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteService, setQuoteService] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginMode, setLoginMode] = useState<'google' | 'password' | 'register'>('google');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Check if user is admin in Firestore or by email
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data() as UserProfile | undefined;
        
        const isDefaultAdmin = firebaseUser.email === "siphes9812@gmail.com" || firebaseUser.email === "siphe98@nextgen.com";
        const hasAdminRole = userData?.role === 'admin';
        
        setIsAdmin(isDefaultAdmin || hasAdminRole);
        setIsSuperUser(isDefaultAdmin);
        
        // Ensure user exists in Firestore
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || '',
            role: isDefaultAdmin ? 'admin' : 'client',
            createdAt: Timestamp.now()
          });
        } else if (!userData?.displayName && firebaseUser.displayName) {
          // Auto-fix missing name if it exists in Auth
          await updateDoc(doc(db, 'users', firebaseUser.uid), {
            displayName: firebaseUser.displayName
          });
        }
      } else {
        setIsAdmin(false);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setLoginError("");
    setIsLoggingIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Check if user is admin
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const userData = userDoc.data() as UserProfile | undefined;
      
      const isDefaultAdmin = firebaseUser.email === "siphes9812@gmail.com" || firebaseUser.email === "siphe98@nextgen.com";
      const hasAdminRole = userData?.role === 'admin';
      
      if (!isDefaultAdmin && !hasAdminRole) {
        await signOut(auth);
        setLoginError(`Access Denied: ${firebaseUser.email} is not an authorized administrator.`);
      } else {
        setIsAdmin(true);
        setIsSuperUser(isDefaultAdmin);
        setView('admin');
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/cancelled-popup-request') {
        setLoginError("Login process was interrupted. Please try again.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        setLoginError("Login popup was closed before completion.");
      } else {
        setLoginError("Login failed. Please try again.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsRegistering(true);
    
    // Convert username to email if necessary
    const email = registerEmail.includes('@') ? registerEmail : `${registerEmail}@nextgen.com`;
    
    try {
      const result = await createUserWithEmailAndPassword(auth, email, registerPassword);
      const isSuper = email === "siphes9812@gmail.com" || email === "siphe98@nextgen.com";
      
      // Update Auth profile
      await updateProfile(result.user, {
        displayName: registerName
      });

      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: email,
        displayName: registerName,
        role: isSuper ? 'admin' : 'client',
        createdAt: Timestamp.now()
      });
      
      setView('admin');
    } catch (error: any) {
      console.error("Registration error:", error);
      setLoginError(error.message || "Failed to create account.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    
    // Convert username to email if necessary
    const email = loginEmail.includes('@') ? loginEmail : `${loginEmail}@nextgen.com`;
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, loginPassword);
      const firebaseUser = result.user;
      
      // Check if user is admin
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const userData = userDoc.data() as UserProfile | undefined;
      
      const isDefaultAdmin = firebaseUser.email === "siphes9812@gmail.com" || firebaseUser.email === "siphe98@nextgen.com";
      const hasAdminRole = userData?.role === 'admin';
      
      if (!isDefaultAdmin && !hasAdminRole) {
        await signOut(auth);
        setLoginError(`Access Denied: ${firebaseUser.email} is not an authorized administrator.`);
      } else {
        setIsAdmin(true);
        setIsSuperUser(isDefaultAdmin);
        setView('admin');
      }
    } catch (error: any) {
      console.error("Password login failed:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setLoginError("Invalid username or password.");
      } else {
        setLoginError("Login failed. Please try again.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('home');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdatingProfile(true);
    setProfileMessage({ type: '', text: '' });
    try {
      await updateProfile(user, { displayName: newProfileName });
      await updateDoc(doc(db, 'users', user.uid), { displayName: newProfileName });
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setProfileMessage({ type: 'error', text: error.message || 'Failed to update profile.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword !== confirmPassword) {
      setProfileMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setIsUpdatingProfile(true);
    setProfileMessage({ type: '', text: '' });
    try {
      await updatePassword(user, newPassword);
      setProfileMessage({ type: 'success', text: 'Password changed successfully!' });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setProfileMessage({ type: 'error', text: error.message || 'Failed to change password. You may need to re-authenticate.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete your account? This action is permanent and will delete all your data.")) return;
    
    setIsUpdatingProfile(true);
    setProfileMessage({ type: '', text: '' });
    
    try {
      // 1. Delete Firestore profile
      await deleteDoc(doc(db, 'users', user.uid));
      
      // 2. Delete Auth account
      await deleteAuthUser(user);
      
      setIsProfileModalOpen(false);
      setView('home');
    } catch (error: any) {
      console.error("Error deleting account:", error);
      setProfileMessage({ 
        type: 'error', 
        text: error.message || 'Failed to delete account. You may need to re-authenticate (log out and back in) before deleting your account.' 
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const submitQuote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await addDoc(collection(db, 'quotes'), {
        customerName: formData.get('name'),
        customerEmail: formData.get('email'),
        serviceType: quoteService || formData.get('service'),
        message: formData.get('message'),
        status: 'pending',
        createdAt: Timestamp.now()
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setIsQuoteModalOpen(false);
        setSubmitSuccess(false);
        setQuoteService("");
      }, 2000);
    } catch (error) {
      console.error("Error submitting quote:", error);
      alert("Failed to submit quote. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleItem = (item: { name: string; price: string }) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(i => i.name === item.name);
      if (isSelected) {
        return prev.filter(i => i.name !== item.name);
      } else {
        return [...prev, item];
      }
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as any } }
  };

  return (
    <ErrorBoundary>
    <div className={`min-h-screen font-sans selection:bg-brand-blue/10 overflow-x-hidden transition-colors duration-500 ${isDarkMode ? 'dark bg-slate-950 text-slate-50' : 'bg-white text-slate-900'}`}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className={`max-w-7xl mx-auto flex items-center justify-between px-8 py-4 rounded-3xl transition-all duration-500 ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/70 border-white/20'} backdrop-blur-md border soft-shadow`}>
          <button onClick={() => setView('login')} className="flex items-center gap-3 group">
            <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110">
              <img 
                src="https://lh3.googleusercontent.com/d/1-vuuu5yAf2CM8IhXl9G1FKfSKlzOT7bt" 
                alt="NextGen Logo" 
                className={`w-full h-full object-contain ${isDarkMode ? 'brightness-125' : ''}`}
                referrerPolicy="no-referrer"
              />
            </div>
            <span className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>NextGen</span>
          </button>
          
          <div className="hidden md:flex items-center gap-8">
            {view === 'home' ? (
              <>
                {['Services', 'About', 'Contact'].map((item) => (
                  <a key={item} href={`#${item.toLowerCase()}`} className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-slate-400 hover:text-brand-blue' : 'text-slate-500 hover:text-brand-blue'}`}>
                    {item}
                  </a>
                ))}
                {isAdmin && (
                  <button 
                    onClick={() => setView('admin')}
                    className="text-sm font-bold text-brand-blue hover:underline flex items-center gap-2"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Admin Panel
                  </button>
                )}
              </>
            ) : (
              <button 
                onClick={() => setView('home')}
                className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-slate-400 hover:text-brand-blue' : 'text-slate-500 hover:text-brand-blue'}`}
              >
                Back to Site
              </button>
            )}
            
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800"></div>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setNewProfileName(user.displayName || "");
                    setIsProfileModalOpen(true);
                  }}
                  className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-brand-blue' : 'bg-slate-50 text-slate-400 hover:text-brand-blue'}`}
                  title="Profile Settings"
                >
                  <User className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleLogout}
                  className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-red-400' : 'bg-slate-50 text-slate-400 hover:text-red-500'}`}
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}

            <button 
              onClick={() => setIsQuoteModalOpen(true)}
              className="px-5 py-2 bg-brand-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              Get Quote
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Background Atmosphere */}
            <div className="fixed inset-0 z-0 pointer-events-none">
              <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] blur-[160px] rounded-full opacity-60 animate-pulse-soft ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50/50'}`}></div>
              <div className={`absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] blur-[160px] rounded-full opacity-60 animate-pulse-soft ${isDarkMode ? 'bg-indigo-900/20' : 'bg-indigo-50/50'}`} style={{ animationDelay: '-2s' }}></div>
            </div>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:48px_48px] opacity-30"></div>
                {/* Decorative Floating Elements */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-100/20 blur-3xl rounded-full animate-float"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-100/20 blur-3xl rounded-full animate-float" style={{ animationDelay: '-3s' }}></div>
              </div>

              <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-blue-100 bg-blue-50/50 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span className="text-xs font-bold tracking-wider text-blue-600 uppercase">Available for 24/7 Support</span>
                  </motion.div>
                  
                  <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 leading-[0.9] text-balance">
                    <span className="block text-slate-900 dark:text-white">NextGen</span>
                    <span className="block text-brand-blue">IT Services</span>
                  </motion.h1>
                  
                  <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-normal max-w-2xl mx-auto mb-12 leading-relaxed text-balance">
                    Elevating your digital experience through professional technical support and innovative infrastructure solutions.
                  </motion.p>

                  <motion.div 
                    variants={itemVariants}
                    className="flex flex-wrap items-center justify-center gap-6"
                  >
                    <button 
                      onClick={() => setIsQuoteModalOpen(true)}
                      className="px-10 py-5 bg-brand-blue text-white font-bold rounded-2xl hover:bg-blue-700 transition-all soft-shadow hover:-translate-y-1 active:scale-95"
                    >
                      Start Your Project
                    </button>
                    <a href="#services" className="px-10 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:-translate-y-1 active:scale-95">
                      View Services
                    </a>
                  </motion.div>
                </motion.div>
              </div>

              {/* Scroll Indicator */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-40"
              >
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-400">Scroll</span>
                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-6 h-10 border-2 border-slate-300 rounded-full flex justify-center p-1.5"
                >
                  <div className="w-1 h-2 bg-brand-blue rounded-full"></div>
                </motion.div>
              </motion.div>
            </section>

      {/* Stats Section */}
      <section className={`py-20 border-y transition-colors duration-500 ${isDarkMode ? 'border-slate-800 bg-slate-900/30' : 'border-slate-100 bg-slate-50/30'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: 'Client Satisfaction', value: '99%' },
              { label: 'Support Tickets', value: '10k+' },
              { label: 'Expert Engineers', value: '25+' },
              { label: 'Response Time', value: '<1hr' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{stat.value}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="inline-block px-4 py-1.5 mb-6 rounded-full bg-brand-blue/10 border border-brand-blue/20"
            >
              <span className="text-[10px] font-black tracking-[0.3em] text-brand-blue uppercase">Our Methodology</span>
            </motion.div>
            <h2 className={`text-5xl md:text-7xl font-black tracking-tighter mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              How We <span className="text-brand-blue italic serif">Work</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className={`absolute top-1/2 left-0 w-full h-[1px] hidden md:block ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
            
            {[
              { icon: <Search className="w-6 h-6" />, title: "Analyze", desc: "We deep-dive into your current infrastructure to identify bottlenecks and opportunities." },
              { icon: <Settings className="w-6 h-6" />, title: "Implement", desc: "Our engineers deploy robust solutions with zero downtime and maximum efficiency." },
              { icon: <Zap className="w-6 h-6" />, title: "Optimize", desc: "Continuous monitoring and fine-tuning to ensure your systems stay ahead of the curve." }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative z-10 text-center group"
              >
                <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-brand-blue' : 'bg-white border-slate-100 text-brand-blue'} border soft-shadow`}>
                  {step.icon}
                </div>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-8xl font-black opacity-[0.03] select-none pointer-events-none">0{i+1}</div>
                <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{step.title}</h3>
                <p className="text-slate-400 font-light leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="space-y-12"
          >
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-[2px] bg-brand-blue rounded-full"></div>
                <span className="text-xs font-black tracking-[0.4em] text-brand-blue uppercase">Our Philosophy</span>
              </div>
              <h3 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                We don't just fix tech. We <span className="text-brand-blue">empower</span> people.
              </h3>
              <p className="text-slate-500 text-lg leading-relaxed font-light">
                At NextGen, we believe technology should be an invisible enabler. Our mission is to handle the complexity so you can focus on what truly matters.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
              {[
                { icon: <History />, title: 'Deep Roots', desc: 'A decade of solving complex technical challenges.' },
                { icon: <Target />, title: 'Precision', desc: 'Meticulous attention to detail in every solution.' }
              ].map((item, i) => (
                <div key={i} className="group">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-brand-blue mb-6 group-hover:scale-110 group-hover:bg-brand-blue group-hover:text-white transition-all duration-300">
                    {item.icon}
                  </div>
                  <h4 className="text-2xl font-bold mb-3 text-slate-900">{item.title}</h4>
                  <p className="text-slate-500 leading-relaxed font-light">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="absolute -inset-10 bg-blue-100/40 rounded-[4rem] blur-3xl opacity-50 animate-pulse-soft"></div>
            <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border border-white/50">
              <img 
                src="https://images.unsplash.com/photo-1573161158365-597e00b72011?auto=format&fit=crop&q=80&w=1000" 
                alt="Modern Office" 
                className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-1000"
                referrerPolicy="no-referrer"
              />
            </div>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-10 -right-10 p-10 glass rounded-[2.5rem] shadow-2xl border border-white/40 hidden md:block animate-float"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-brand-blue flex items-center justify-center text-white soft-shadow">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">100%</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Secure & Certified</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Meet the Directors */}
      <section className="py-20 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-xs font-black tracking-[0.5em] text-brand-blue uppercase mb-6"
            >
              Leadership
            </motion.h2>
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold tracking-tighter text-slate-900"
            >
              Meet the Directors
            </motion.h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-3xl mx-auto">
            {[
              { 
                name: 'Siphe', 
                role: 'Company Director', 
                image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800',
                desc: 'Visionary leader focused on digital transformation and client success.'
              },
              { 
                name: 'Lizo', 
                role: 'Company Director', 
                image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800',
                desc: 'Expert strategist specializing in technical infrastructure and innovation.'
              }
            ].map((member, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="group text-center"
              >
                <div className="relative w-48 h-48 mx-auto rounded-[2.5rem] overflow-hidden mb-8 soft-shadow border border-slate-100">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-brand-blue/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-6">
                    <p className="text-white text-xs font-medium leading-relaxed">
                      {member.desc}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-slate-900 mb-1">{member.name}</h4>
                  <p className="text-[10px] font-black text-brand-blue uppercase tracking-[0.3em]">{member.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-20 px-6 bg-slate-50/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#3b82f6_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-50 border border-blue-100"
            >
              <span className="text-[10px] font-black tracking-[0.3em] text-brand-blue uppercase">Transparent Pricing</span>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 mb-6"
            >
              Investment <span className="text-brand-blue italic serif">Plans</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-500 max-w-2xl mx-auto text-lg font-light leading-relaxed"
            >
              Professional IT infrastructure and digital solutions tailored to your business scale. No hidden fees, just pure performance.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -8 }}
                className={`group relative p-10 rounded-[3.5rem] bg-white border border-slate-100 hover:border-brand-blue/30 transition-all duration-500 soft-shadow overflow-hidden ${index === 1 ? 'lg:scale-105 z-20 ring-4 ring-blue-50' : ''}`}
              >
                {index === 1 && (
                  <div className="absolute top-8 right-8 bg-brand-blue text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-blue-200">
                    Most Popular
                  </div>
                )}

                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl group-hover:bg-blue-100/50 transition-colors duration-500"></div>
                
                <div className={`relative w-16 h-16 ${service.lightColor} ${service.textColor} rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm`}>
                  {service.icon}
                </div>
                
                <h3 className="relative text-2xl font-bold mb-2 text-slate-900 tracking-tight">{service.title}</h3>
                <p className="relative text-xs text-slate-400 font-medium uppercase tracking-widest mb-10">Professional Tier</p>
                
                <ul className="relative space-y-6 mb-10">
                  {service.items.map((item) => {
                    const isSelected = selectedItems.some(i => i.name === item.name);
                    return (
                      <li 
                        key={item.name} 
                        className="group/item cursor-pointer"
                        onClick={() => toggleItem(item)}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-brand-blue border-brand-blue' : 'border-slate-200 group-hover/item:border-blue-300'}`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className={`text-sm font-semibold transition-colors duration-300 ${isSelected ? 'text-brand-blue' : 'text-slate-600 group-hover/item:text-brand-blue'}`}>
                              {item.name}
                            </span>
                          </div>
                          <div className="flex-1 border-b border-dashed border-slate-100 mt-1 group-hover/item:border-blue-100 transition-colors duration-300"></div>
                          <span className={`text-sm font-black whitespace-nowrap px-3 py-1.5 rounded-xl border transition-all duration-300 ${isSelected ? 'bg-brand-blue text-white border-brand-blue' : 'bg-blue-50/30 text-brand-blue border-blue-100/30 group-hover/item:bg-brand-blue group-hover/item:text-white group-hover/item:border-brand-blue'}`}>
                            {item.price}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <a 
                  href={`https://wa.me/27637972251?text=${encodeURIComponent(`Hi NextGen, I'm interested in the ${service.title} plan. Could you provide more details?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full py-4 rounded-2xl font-bold text-sm text-center transition-all duration-300 ${index === 1 ? 'bg-brand-blue text-white hover:bg-blue-700 shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                  Select {service.title}
                </a>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mt-20 text-center p-12 rounded-[3rem] bg-slate-900 text-white soft-shadow relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/20 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-brand-blue/30 transition-colors duration-700"></div>
            <div className="relative z-10">
              <h4 className="text-3xl font-bold mb-4 tracking-tight">Need a custom enterprise solution?</h4>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto font-light">We provide specialized infrastructure for large-scale operations. Let's build something unique together.</p>
              <a 
                href={`https://wa.me/27637972251?text=${encodeURIComponent("Hi NextGen, I'm interested in a custom enterprise solution for my business. Can we discuss the requirements?")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95"
              >
                Contact Enterprise Sales
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1">
              <h2 className="text-xs font-black tracking-[0.5em] text-brand-blue uppercase mb-6">Testimonials</h2>
              <h3 className="text-4xl font-bold tracking-tighter text-slate-900 mb-8 leading-tight">What our clients say about us.</h3>
              <p className="text-slate-500 text-base font-light leading-relaxed">
                We take pride in delivering excellence. Here's how we've helped our clients navigate their technical journeys.
              </p>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { name: 'John D.', role: 'Small Business Owner', quote: 'NextGen transformed our office setup. Their remote support is incredibly fast and reliable.' },
                { name: 'Sarah M.', role: 'Freelancer', quote: 'The web development team built exactly what I needed. Professional, airy design and great performance.' },
                { name: 'Michael R.', role: 'Tech Enthusiast', quote: 'Best hardware repair service in the city. They fixed my custom PC in record time.' },
                { name: 'Emily L.', role: 'Corporate Manager', quote: 'Their IT consulting saved us thousands in infrastructure costs. Highly recommended.' }
              ].map((t, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-[2.5rem] bg-slate-50/50 border border-slate-100 soft-shadow hover:bg-white transition-colors duration-500"
                >
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Heart key={i} className="w-4 h-4 fill-brand-blue text-brand-blue" />
                    ))}
                  </div>
                  <p className="text-slate-600 italic mb-8 font-light leading-relaxed">"{t.quote}"</p>
                  <div>
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">{t.role}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-xs font-black tracking-[0.5em] text-brand-blue uppercase mb-6"
          >
            Ready to Connect?
          </motion.h2>
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter text-slate-900"
          >
            Get In Touch
          </motion.h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {/* Siphe */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-12 rounded-[3.5rem] bg-white border border-slate-100 soft-shadow text-center group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-[5rem] -mr-16 -mt-16 transition-all duration-500 group-hover:scale-150"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 bg-blue-50 text-brand-blue rounded-[2rem] flex items-center justify-center mx-auto mb-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <Phone className="w-12 h-12" />
              </div>
              <h4 className="text-3xl font-bold mb-3 text-slate-900">Siphe</h4>
              <p className="text-brand-blue font-bold text-lg mb-10">063 797 2251</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="tel:0637972251"
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-brand-blue text-white rounded-2xl font-bold hover:bg-blue-700 transition-all soft-shadow active:scale-95"
                >
                  <Phone className="w-5 h-5" /> Call Now
                </a>
                <a 
                  href="https://wa.me/27637972251"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-5 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95"
                >
                  <MessageCircle className="w-5 h-5" /> WhatsApp
                </a>
              </div>
            </div>
          </motion.div>

          {/* Lizo */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-12 rounded-[3.5rem] bg-white border border-slate-100 soft-shadow text-center group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[5rem] -mr-16 -mt-16 transition-all duration-500 group-hover:scale-150"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                <MessageCircle className="w-12 h-12" />
              </div>
              <h4 className="text-3xl font-bold mb-3 text-slate-900">Lizo</h4>
              <p className="text-indigo-600 font-bold text-lg mb-10">076 869 9399</p>
              <div className="w-full">
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.4em] font-black mb-6">Direct WhatsApp Only</p>
                <a 
                  href="https://wa.me/27768699399"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all soft-shadow active:scale-95"
                >
                  <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

        </motion.div>
      )}

      {/* Admin View */}
      {view === 'admin' && (
        <motion.div
          key="admin"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="pt-32 pb-20 px-6 max-w-7xl mx-auto"
        >
          {isAdmin ? (
            <AdminDashboard isDarkMode={isDarkMode} isSuperUser={isSuperUser} />
          ) : (
            <div className="text-center py-20">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">Access Denied</h2>
              <p className="text-slate-500 mb-8">You do not have permission to view this page.</p>
              <button onClick={() => setView('home')} className="px-8 py-3 bg-brand-blue text-white rounded-xl">Return Home</button>
            </div>
          )}
        </motion.div>
      )}

      {/* Login View */}
      {view === 'login' && (
        <motion.div
          key="login"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="min-h-screen flex items-center justify-center px-6"
        >
          <div className={`max-w-md w-full p-10 rounded-[2.5rem] border transition-all duration-500 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} soft-shadow`}>
            <div className="text-center mb-10">
              <div className="w-20 h-20 mx-auto mb-6 bg-brand-blue/10 rounded-3xl flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-brand-blue" />
              </div>
              <h2 className={`text-3xl font-black tracking-tighter mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Admin Login</h2>
              <p className="text-slate-500 text-sm">Sign in to manage your IT service requests.</p>
            </div>
            
            {user ? (
              <div className="text-center">
                <p className="mb-6 text-slate-600">Logged in as <span className="font-bold">{user.email}</span></p>
                <button 
                  onClick={() => setView('admin')}
                  className="w-full py-4 bg-brand-blue text-white font-bold rounded-2xl hover:bg-blue-700 transition-all mb-4"
                >
                  Go to Dashboard
                </button>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 text-sm font-bold">Sign Out</button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
                  <button 
                    onClick={() => setLoginMode('google')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginMode === 'google' ? 'bg-white dark:bg-slate-700 text-brand-blue shadow-sm' : 'text-slate-500'}`}
                  >
                    Google
                  </button>
                  <button 
                    onClick={() => setLoginMode('password')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginMode === 'password' ? 'bg-white dark:bg-slate-700 text-brand-blue shadow-sm' : 'text-slate-500'}`}
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => setLoginMode('register')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginMode === 'register' ? 'bg-white dark:bg-slate-700 text-brand-blue shadow-sm' : 'text-slate-500'}`}
                  >
                    Register
                  </button>
                </div>

                {loginMode === 'google' ? (
                  <button 
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className={`w-full py-4 flex items-center justify-center gap-3 font-bold rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'} disabled:opacity-50`}
                  >
                    {isLoggingIn ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                    )}
                    {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
                  </button>
                ) : loginMode === 'password' ? (
                  <form onSubmit={handlePasswordLogin} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Username (Email)</label>
                      <input 
                        type="email" 
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className={`w-full px-5 py-3 rounded-xl border outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-brand-blue' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-brand-blue'}`}
                        placeholder="admin@nextgen.com"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Password</label>
                      <input 
                        type="password" 
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className={`w-full px-5 py-3 rounded-xl border outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-brand-blue' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-brand-blue'}`}
                        placeholder="••••••••"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-4 bg-brand-blue text-white font-bold rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className={`w-full px-5 py-3 rounded-xl border outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-brand-blue' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-brand-blue'}`}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className={`w-full px-5 py-3 rounded-xl border outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-brand-blue' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-brand-blue'}`}
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Password</label>
                      <input 
                        type="password" 
                        required
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className={`w-full px-5 py-3 rounded-xl border outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-brand-blue' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-brand-blue'}`}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 text-[10px] rounded-lg">
                      Note: Registering with <span className="font-bold">siphe98</span> or <span className="font-bold">siphes9812@gmail.com</span> will automatically grant Super Admin privileges.
                    </div>
                    <button 
                      type="submit"
                      disabled={isRegistering}
                      className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isRegistering ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                    </button>
                  </form>
                )}

                {loginError && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold">
                    <AlertCircle className="w-4 h-4" />
                    {loginError}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-xl p-10 rounded-[2.5rem] border transition-all duration-500 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} soft-shadow overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Profile Settings</h3>
                <button onClick={() => setIsProfileModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-10">
                {/* Update Name */}
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <h4 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Update Information</h4>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Display Name</label>
                    <input 
                      type="text" 
                      required
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      className={`w-full px-5 py-3 rounded-xl border outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-brand-blue' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-brand-blue'}`}
                      placeholder="Your Name"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="w-full py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Update Name'}
                  </button>
                </form>

                <div className={`h-[1px] w-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}></div>

                {/* Change Password */}
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <h4 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Change Password</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">New Password</label>
                      <input 
                        type="password" 
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`w-full px-5 py-3 rounded-xl border outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-brand-blue' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-brand-blue'}`}
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Confirm Password</label>
                      <input 
                        type="password" 
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full px-5 py-3 rounded-xl border outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-brand-blue' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-brand-blue'}`}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Change Password'}
                  </button>
                </form>

                {profileMessage.text && (
                  <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-bold ${
                    profileMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    {profileMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {profileMessage.text}
                  </div>
                )}

                <div className={`h-[1px] w-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}></div>

                <div className="pt-2">
                  <h4 className="text-sm font-black uppercase tracking-widest text-red-500 mb-4">Danger Zone</h4>
                  <p className="text-xs text-slate-400 mb-4">Deleting your account will remove all your data from our systems. This action cannot be undone.</p>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={isUpdatingProfile}
                    className="w-full py-3 border border-red-500/30 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quote Modal */}
      <AnimatePresence>
        {isQuoteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQuoteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-xl p-10 rounded-[2.5rem] border transition-all duration-500 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} soft-shadow overflow-hidden`}
            >
              {submitSuccess ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className={`text-3xl font-black tracking-tighter mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Request Sent!</h3>
                  <p className="text-slate-500">We'll get back to you within 60 minutes.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Get a <span className="text-brand-blue italic serif">Quote</span></h3>
                    <button onClick={() => setIsQuoteModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                      <X className="w-6 h-6 text-slate-400" />
                    </button>
                  </div>
                  
                  <form onSubmit={submitQuote} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Your Name</label>
                        <input required name="name" type="text" placeholder="John Doe" className={`w-full px-5 py-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Email Address</label>
                        <input required name="email" type="email" placeholder="john@example.com" className={`w-full px-5 py-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`} />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Service Required</label>
                      <select 
                        required 
                        name="service" 
                        value={quoteService}
                        onChange={(e) => setQuoteService(e.target.value)}
                        className={`w-full px-5 py-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`}
                      >
                        <option value="">Select a service...</option>
                        {services.flatMap(s => s.items).map(item => (
                          <option key={item.name} value={item.name}>{item.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Message (Optional)</label>
                      <textarea name="message" rows={4} placeholder="Tell us more about your needs..." className={`w-full px-5 py-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`} />
                    </div>

                    <button 
                      disabled={isSubmitting}
                      type="submit" 
                      className="w-full py-5 bg-brand-blue text-white font-bold rounded-2xl hover:bg-blue-700 transition-all soft-shadow flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      {isSubmitting ? 'Sending Request...' : 'Submit Quote Request'}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className={`py-16 px-6 text-center border-t transition-colors duration-500 ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-slate-50/20'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src="https://lh3.googleusercontent.com/d/1-vuuu5yAf2CM8IhXl9G1FKfSKlzOT7bt" 
                  alt="NextGen Logo" 
                  className={`w-full h-full object-contain ${isDarkMode ? 'brightness-125' : ''}`}
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>NextGen</span>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">All Systems Operational</span>
              </div>
            </div>

            <div className="flex gap-6">
              {[Phone, Mail, MapPin].map((Icon, i) => (
                <a key={i} href="#" className={`p-3 rounded-xl transition-all ${isDarkMode ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-white text-slate-400 hover:text-brand-blue'} border border-transparent hover:border-brand-blue/20 shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mb-8">
            <div className={`w-12 h-[1px] ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
            <div className="text-xs font-black text-brand-blue uppercase tracking-[0.3em]">Excellence Since 2014</div>
            <div className={`w-12 h-[1px] ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
          </div>

          <p className="text-slate-400 font-bold text-xs tracking-[0.5em] uppercase mb-4">
            NextGen IT Services // Professional Digital Infrastructure
          </p>
          <p className="text-slate-300 text-[10px] tracking-widest uppercase">
            © {new Date().getFullYear()} All Rights Reserved // Built with Precision
          </p>
        </div>
      </footer>

      {/* AI Chatbot */}
      {/* AI Chatbot */}
      <Chatbot />

      {/* Floating Selection Bar */}
      <AnimatePresence>
        {selectedItems.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-2xl"
          >
            <div className="bg-slate-900 text-white p-4 rounded-[2rem] shadow-2xl border border-slate-800 flex items-center justify-between gap-6">
              <div className="flex items-center gap-4 pl-4">
                <div className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold">{selectedItems.length} {selectedItems.length === 1 ? 'Service' : 'Services'} Selected</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ready for your quote</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedItems([])}
                  className="px-6 py-3 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Clear All
                </button>
                <button 
                  onClick={() => {
                    setQuoteService(selectedItems.map(i => i.name).join(', '));
                    setIsQuoteModalOpen(true);
                  }}
                  className="px-8 py-3 bg-brand-blue text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                >
                  Request Quote <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </ErrorBoundary>
  );
}

// --- Admin Components ---

function AdminDashboard({ isDarkMode, isSuperUser }: { isDarkMode: boolean; isSuperUser: boolean }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'quotes' | 'users'>('quotes');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'completed'>('all');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<'admin' | 'client'>('admin');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState("");

  useEffect(() => {
    const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const quotesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Quote[];
      setQuotes(quotesData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isSuperUser && activeTab === 'users') {
      const q = query(collection(db, 'users'), orderBy('email', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as UserProfile[];
        setUsers(usersData);
      }, (error) => {
        console.error("Firestore Users Error:", error);
      });
      return () => unsubscribe();
    }
  }, [isSuperUser, activeTab]);

  const updateStatus = async (id: string, status: Quote['status']) => {
    try {
      await updateDoc(doc(db, 'quotes', id), { status });
      if (selectedQuote?.id === id) {
        setSelectedQuote(prev => prev ? { ...prev, status } : null);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const deleteQuote = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this quote request?")) return;
    try {
      await deleteDoc(doc(db, 'quotes', id));
      setSelectedQuote(null);
    } catch (error) {
      console.error("Error deleting quote:", error);
    }
  };

  const updateUserRole = async (uid: string, role: 'admin' | 'client') => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${role}?`)) return;
    try {
      await updateDoc(doc(db, 'users', uid), { role });
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update role. Only super users can perform this action.");
    }
  };

  const deleteUser = async (uid: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This will NOT delete their authentication account, only their Firestore profile.")) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Only super users can perform this action.");
    }
  };

  const updateUserName = async (uid: string) => {
    if (!editingUserName.trim()) return;
    try {
      await updateDoc(doc(db, 'users', uid), { displayName: editingUserName });
      setEditingUserId(null);
    } catch (error) {
      console.error("Error updating user name:", error);
      alert("Failed to update name.");
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperUser) return;
    setIsCreatingAdmin(true);
    try {
      // Use secondary app to avoid logging out current user
      const secondaryApp = initializeApp(firebaseConfig, 'Secondary');
      const secondaryAuth = getAuth(secondaryApp);
      
      // Convert username to email if necessary
      const email = newAdminEmail.includes('@') ? newAdminEmail : `${newAdminEmail}@nextgen.com`;
      
      const result = await createUserWithEmailAndPassword(secondaryAuth, email, newAdminPassword);
      
      // Set role in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: email,
        role: newUserRole,
        createdAt: Timestamp.now()
      });
      
      await deleteApp(secondaryApp);
      setNewAdminEmail("");
      setNewAdminPassword("");
      setNewUserRole('admin');
      alert("User created successfully!");
    } catch (error: any) {
      console.error("Error creating user:", error);
      alert("Error creating user: " + error.message);
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const filteredQuotes = quotes.filter(q => filter === 'all' || q.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-10 h-10 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setActiveTab('quotes')}
            className={`text-4xl font-black tracking-tighter transition-all ${activeTab === 'quotes' ? (isDarkMode ? 'text-white' : 'text-slate-900') : 'text-slate-400 hover:text-slate-500'}`}
          >
            Quotes
          </button>
          {isSuperUser && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`text-4xl font-black tracking-tighter transition-all ${activeTab === 'users' ? (isDarkMode ? 'text-white' : 'text-slate-900') : 'text-slate-400 hover:text-slate-500'}`}
            >
              Users
            </button>
          )}
        </div>
        
        {activeTab === 'quotes' && (
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {(['all', 'pending', 'reviewed', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                  filter === f 
                    ? 'bg-brand-blue border-brand-blue text-white shadow-lg shadow-blue-500/20' 
                    : isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'quotes' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredQuotes.length === 0 ? (
              <div className={`p-20 text-center rounded-[2.5rem] border ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No quotes found</p>
              </div>
            ) : (
              filteredQuotes.map((quote) => (
                <motion.div
                  layoutId={quote.id}
                  key={quote.id}
                  onClick={() => setSelectedQuote(quote)}
                  className={`p-6 rounded-3xl border cursor-pointer transition-all group ${
                    selectedQuote?.id === quote.id 
                      ? 'ring-2 ring-brand-blue/50 border-brand-blue' 
                      : isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{quote.customerName}</h4>
                        <p className="text-xs text-slate-400">{quote.customerEmail}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      quote.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                      quote.status === 'reviewed' ? 'bg-blue-100 text-blue-600' :
                      'bg-emerald-100 text-emerald-600'
                    }`}>
                      {quote.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-2">
                      <Settings className="w-3 h-3" />
                      {quote.serviceType}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {quote.createdAt?.toDate().toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedQuote ? (
                <motion.div
                  key={selectedQuote.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`sticky top-32 p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} soft-shadow`}
                >
                  <div className="flex items-center justify-between mb-8">
                    <h3 className={`text-2xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Details</h3>
                    <button onClick={() => deleteQuote(selectedQuote.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Customer</label>
                      <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedQuote.customerName}</p>
                      <p className="text-sm text-slate-500">{selectedQuote.customerEmail}</p>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Service</label>
                      <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedQuote.serviceType}</p>
                    </div>

                    {selectedQuote.message && (
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Message</label>
                        <p className="text-sm text-slate-500 leading-relaxed italic">"{selectedQuote.message}"</p>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Update Status</label>
                      <div className="grid grid-cols-1 gap-2">
                        {(['pending', 'reviewed', 'completed'] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(selectedQuote.id, s)}
                            className={`w-full py-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                              selectedQuote.status === s 
                                ? 'bg-brand-blue border-brand-blue text-white' 
                                : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'
                            }`}
                          >
                            Mark as {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className={`sticky top-32 p-12 text-center rounded-[2.5rem] border border-dashed ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                  <Eye className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-400 text-sm font-medium">Select a request to view details</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Create User Form */}
          <div className="lg:col-span-1">
            <div className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} soft-shadow`}>
              <h3 className={`text-2xl font-black tracking-tighter mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Create User</h3>
              <form onSubmit={createUser} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Username or Email</label>
                  <input 
                    type="text" 
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className={`w-full px-5 py-3 rounded-xl border outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-brand-blue' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-brand-blue'}`}
                    placeholder="john_doe or admin@nextgen.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Password</label>
                  <input 
                    type="password" 
                    required
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className={`w-full px-5 py-3 rounded-xl border outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-brand-blue' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-brand-blue'}`}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Assign Rights (Role)</label>
                  <select 
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'client')}
                    className={`w-full px-5 py-3 rounded-xl border outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-brand-blue' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-brand-blue'}`}
                  >
                    <option value="admin">Administrator</option>
                    <option value="client">Client / Standard User</option>
                  </select>
                </div>
                <button 
                  disabled={isCreatingAdmin}
                  type="submit"
                  className="w-full py-4 bg-brand-blue text-white font-bold rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreatingAdmin ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                  {isCreatingAdmin ? 'Creating...' : 'Create User Account'}
                </button>
              </form>
            </div>
          </div>

          {/* User List */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {users.map((u) => (
              <div 
                key={u.uid}
                className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    {editingUserId === u.uid ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="text"
                          value={editingUserName}
                          onChange={(e) => setEditingUserName(e.target.value)}
                          className={`flex-1 px-3 py-1 text-sm rounded-lg border outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-brand-blue' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-blue'}`}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateUserName(u.uid);
                            if (e.key === 'Escape') setEditingUserId(null);
                          }}
                        />
                        <button onClick={() => updateUserName(u.uid)} className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingUserId(null)} className="p-1 text-slate-400 hover:text-slate-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group/name">
                        <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{u.displayName || 'Unnamed User'}</h4>
                        <button 
                          onClick={() => {
                            setEditingUserId(u.uid);
                            setEditingUserName(u.displayName || "");
                          }}
                          className="p-1 opacity-0 group-hover/name:opacity-100 text-slate-400 hover:text-brand-blue transition-all"
                          title="Edit Name"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'text-brand-blue' : 'text-slate-400'}`}>
                    {u.role}
                  </span>
                  
                  {u.email !== "siphes9812@gmail.com" && u.email !== "siphe98@nextgen.com" && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateUserRole(u.uid, u.role === 'admin' ? 'client' : 'admin')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          u.role === 'admin' 
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                            : 'bg-brand-blue text-white hover:bg-blue-700'
                        }`}
                      >
                        {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                      </button>
                      <button 
                        onClick={() => deleteUser(u.uid)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete User Profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
