'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import RichEditor from '@/components/RichEditor';
import {
  Globe,
  Mail,
  Send,
  Trash2,
  Archive,
  AlertOctagon,
  Inbox,
  Star,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Paperclip,
  Layers,
  Sparkles,
  LogOut,
  CreditCard,
  Lock,
  User,
  ShieldCheck,
  Check,
  Folder,
  Tag,
  Calendar,
  AlertTriangle,
  HardDrive,
  Settings2,
  ChevronRight,
  ArrowRight,
  Sun,
  Moon,
  Code2,
  Copy,
  KeyRound,
  Terminal,
  FileText,
  Bookmark,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List as ListIcon,
  ListOrdered,
  Link2,
  Eye,
  Code,
  Receipt,
  ArrowUpCircle,
  CheckCircle,
  Building2,
  Briefcase,
  Download,
  Printer,
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  MailCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
} from 'lucide-react';

export default function MailboxApp() {
  // Theme state: 'dark' | 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [messageHeadersModal, setMessageHeadersModal] = useState<any>(null); // For Gmail/cPanel style Show Original Headers modal

  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Auth Modal/Screen states: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authStep, setAuthStep] = useState<'select_plan' | 'payment_register'>('select_plan');

  // Plans list
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanForRegistration, setSelectedPlanForRegistration] = useState<any>(null);

  // Registration & Login forms (Multi-Tenant SaaS)
  const [regForm, setRegForm] = useState({
    companyName: '',
    businessEmail: '',
    phone: '',
    address: '',
    name: '',
    email: '',
    password: '',
    paymentMethod: 'card',
    cardNumber: '4242 •••• •••• 4242',
    cardExpiry: '12/28',
    cardCvc: '123',
    transactionId: '',
  });
  const [registrationSuccessNotice, setRegistrationSuccessNotice] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Dashboard Navigation tabs: 'overview' | 'webmail' | 'domains' | 'mailboxes' | 'bulk' | 'subscriptions' | 'superadmin' | 'subusers' | 'apikeys' | 'templates' | 'billing' | 'settings'
  const [activeTab, setActiveTab] = useState<'overview' | 'webmail' | 'domains' | 'mailboxes' | 'bulk' | 'subscriptions' | 'superadmin' | 'subusers' | 'apikeys' | 'templates' | 'billing' | 'settings'>('overview');

  // Company Information, Email Signature/Footer & User Profile Settings State
  const [companySettingsForm, setCompanySettingsForm] = useState({
    companyName: '',
    businessEmail: '',
    phone: '',
    address: '',
    emailSignature: '',
    emailFooter: '',
  });
  const [profileSettingsForm, setProfileSettingsForm] = useState({
    name: '',
    email: '',
    signature: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Billing & Invoices state
  const [billingSummary, setBillingSummary] = useState<any>(null);
  const [userInvoices, setUserInvoices] = useState<any[]>([]);
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<any>(null);
  const [invoiceViewModal, setInvoiceViewModal] = useState<any>(null); // Printable & Downloadable Invoice Modal
  const [upgradePaymentForm, setUpgradePaymentForm] = useState({
    paymentMethod: 'card',
    transactionId: '',
  });

  // Email Templates state
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [templateModal, setTemplateModal] = useState(false);
  const [templateEditorView, setTemplateEditorView] = useState<'editor' | 'preview' | 'code'>('editor');
  const [templateFormData, setTemplateFormData] = useState({
    id: null,
    name: '',
    subject: '',
    category: 'General',
    bodyHtml: '',
  });

  // API Keys state (External Email REST API)
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyModal, setNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeySender, setNewKeySender] = useState('');
  const [justGeneratedKey, setJustGeneratedKey] = useState<string | null>(null);

  // Domains & Mailboxes state
  const [domains, setDomains] = useState<any[]>([]);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [editDomainModal, setEditDomainModal] = useState<any>(null);
  const [editDomainName, setEditDomainName] = useState('');
  const [selectedDomainDns, setSelectedDomainDns] = useState<any>(null);
  const [verifyingDns, setVerifyingDns] = useState(false);

  const [mailboxes, setMailboxes] = useState<any[]>([]);
  const [selectedMailbox, setSelectedMailbox] = useState<any>(null);
  const [newMailboxModal, setNewMailboxModal] = useState(false);
  const [newMailboxData, setNewMailboxData] = useState({ username: '', password: '', fullName: '', signature: '', quotaMb: 2048, roleId: '', domainId: '' });
  const [editMailboxModal, setEditMailboxModal] = useState<any>(null);
  const [editMailboxForm, setEditMailboxForm] = useState({ fullName: '', signature: '', quotaMb: 2048, roleId: '', password: '' });

  // Webmail state
  const [currentFolder, setCurrentFolder] = useState<string>('inbox');
  const [activeCustomFolder, setActiveCustomFolder] = useState<any>(null);
  const [activeLabel, setActiveLabel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [selectedMessageIds, setSelectedMessageIds] = useState<number[]>([]);
  const [starredTotal, setStarredTotal] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ used_kb: 0, total_msgs: 0 });

  // Custom Folders & Labels state
  const [customFolders, setCustomFolders] = useState<any[]>([]);
  const [customLabels, setCustomLabels] = useState<any[]>([]);
  const [createFolderModal, setCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6');
  const [createLabelModal, setCreateLabelModal] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#10b981');

  // Compose / Schedule Modal state
  // Compose / Schedule Modal state (Gmail style dock)
  const [composeModal, setComposeModal] = useState(false);
  const [isComposeMinimized, setIsComposeMinimized] = useState(false);
  const [composeEditorView, setComposeEditorView] = useState<'editor' | 'preview' | 'code'>('editor');
  const [isScheduling, setIsScheduling] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    bcc: '',
    toTags: [] as string[],
    ccTags: [] as string[],
    bccTags: [] as string[],
    toInput: '',
    ccInput: '',
    bccInput: '',
    subject: '',
    bodyText: '',
    bodyHtml: '',
    priority: 'normal',
    scheduledAt: '',
  });

  // Bulk Campaign & Groups state
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [contactLists, setContactLists] = useState<any[]>([]);
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState({ title: '', subject: '', bodyHtml: '', listId: '', mailboxId: '' });
  const [createGroupModal, setCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCsv, setNewGroupCsv] = useState('');

  // Sub-Users state (Legacy) & Company Roles
  const [subUsers, setSubUsers] = useState<any[]>([]);
  const [subUserModal, setSubUserModal] = useState(false);
  const [subUserForm, setSubUserForm] = useState({
    name: '',
    email: '',
    password: '',
    permissions: {
      canSendBulk: false,
      canDeleteMail: true,
      canManageFolders: true,
      canManageTags: true,
      canManageDomains: false,
      canManageMailboxes: false,
    },
  });

  // Company Roles & Granular Permissions state
  const [companyRoles, setCompanyRoles] = useState<any[]>([]);
  const [roleModal, setRoleModal] = useState(false);
  const [roleForm, setRoleForm] = useState({
    id: null as number | null,
    name: '',
    description: '',
    permissions: {
      canSwitchMailbox: false,
      canSendBulk: false,
      canDeleteMail: true,
      canManageFolders: true,
      // Granular Custom Domain permissions
      canAddDomains: false,
      canEditDomains: false,
      canDeleteDomains: false,
      // Granular Email Templates permissions
      canCreateTemplates: false,
      canEditTemplates: false,
      canDeleteTemplates: false,
      // Granular REST API Keys access
      canAccessRestApi: false,
      // Granular Mailboxes permissions
      canCreateMailboxes: false,
      canEditMailboxes: false,
      canDeleteMailboxes: false,
    },
  });
  // Super Admin state (Multi-Tenant SaaS Oversight)
  const [adminCompanies, setAdminCompanies] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminPlans, setAdminPlans] = useState<any[]>([]);
  const [adminInvoices, setAdminInvoices] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [companyPlanModal, setCompanyPlanModal] = useState<any>(null); // For Super Admin direct upgrade
  const [createCompanyModal, setCreateCompanyModal] = useState(false); // For Super Admin direct new company creation
  const [newCompanyFormData, setNewCompanyFormData] = useState({
    companyName: '',
    businessEmail: '',
    phone: '',
    address: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    planId: '',
  });
  const [createCompanyLoading, setCreateCompanyLoading] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [planFormData, setPlanFormData] = useState({
    id: null,
    name: '',
    slug: '',
    price_monthly: 19.99,
    max_domains: 3,
    max_mailboxes: 10,
    storage_quota_mb: 5120,
    bulk_mail_daily_limit: 1000,
  });

  // Check saved session & theme on mount
  useEffect(() => {
    fetchPlans();
    const saved = localStorage.getItem('mailbox_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem('mailbox_user');
      }
    }
    const savedTheme = localStorage.getItem('mailbox_theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    setAuthChecking(false);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('mailbox_theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    toast.info(`Switched to ${nextTheme.toUpperCase()} theme`);
  };

  // Fetch dashboard data when user is logged in
  useEffect(() => {
    if (currentUser?.id) {
      fetchDomains(currentUser.id, currentUser.company_id);
      fetchMailboxes(currentUser.id, currentUser.company_id);
      fetchRoles(currentUser.company_id);
      fetchBulkData(currentUser.id);
      fetchOrganization(currentUser.id, selectedMailbox?.id);
      fetchApiKeys(currentUser.id);
      fetchTemplates(currentUser.id, currentUser.company_id);
      fetchBilling(currentUser.id);
      fetchSettings(currentUser.id);
      if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
        fetchAdminData();
      }
    }
  }, [currentUser]);

  const fetchSettings = async (userId: number) => {
    try {
      const res = await fetch(`/api/settings?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        if (data.company) {
          setCompanySettingsForm({
            companyName: data.company.name || '',
            businessEmail: data.company.businessEmail || '',
            phone: data.company.phone || '',
            address: data.company.address || '',
            emailSignature: data.company.emailSignature || '',
            emailFooter: data.company.emailFooter || '',
          });
        }
        if (data.profile) {
          setProfileSettingsForm((prev) => ({
            ...prev,
            name: data.profile.name || '',
            email: data.profile.email || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCompanyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setSettingsLoading(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_company',
          userId: currentUser.id,
          ...companySettingsForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('mailbox_user', JSON.stringify(data.user));
        }
        toast.success(data.message || 'Company information updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update company');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating company');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    if (profileSettingsForm.newPassword) {
      if (profileSettingsForm.newPassword !== profileSettingsForm.confirmPassword) {
        toast.error('New password and confirm password do not match!');
        return;
      }
      if (!profileSettingsForm.currentPassword) {
        toast.warning('Please enter your current password to set a new password.');
        return;
      }
    }

    setSettingsLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          userId: currentUser.id,
          name: profileSettingsForm.name,
          email: profileSettingsForm.email,
          currentPassword: profileSettingsForm.currentPassword,
          newPassword: profileSettingsForm.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('mailbox_user', JSON.stringify(data.user));
        }
        setProfileSettingsForm((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
        toast.success(data.message || 'Profile and password updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating profile');
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchBilling = async (userId: number) => {
    try {
      const res = await fetch(`/api/billing?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setBillingSummary(data.billing);
        setUserInvoices(data.billing?.invoices || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !selectedUpgradePlan?.id) return;

    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          newPlanId: selectedUpgradePlan.id,
          paymentMethod: upgradePaymentForm.paymentMethod,
          transactionId: upgradePaymentForm.transactionId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUpgradeModal(false);
        fetchBilling(currentUser.id);
        toast.success(data.message || 'Upgrade request submitted! Pending Super Admin approval.');
      } else {
        toast.error(data.message || 'Failed to submit upgrade request');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error processing upgrade');
    }
  };

  const handleApproveInvoice = async (invoiceId: number) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_invoice', invoiceId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminData();
        toast.success(data.message || 'Invoice approved and plan activated!');
      } else {
        toast.error(data.message || 'Failed to approve invoice');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error approving invoice');
    }
  };

  const handleRejectInvoice = async (invoiceId: number) => {
    if (!confirm('Are you sure you want to reject this invoice?')) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject_invoice', invoiceId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminData();
        toast.info(data.message || 'Invoice rejected');
      } else {
        toast.error(data.message || 'Failed to reject invoice');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error rejecting invoice');
    }
  };

  const fetchTemplates = async (userId: number, companyId?: number) => {
    try {
      const url = companyId ? `/api/templates?userId=${userId}&companyId=${companyId}` : `/api/templates?userId=${userId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setEmailTemplates(data.templates || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !templateFormData.name || !templateFormData.subject || !templateFormData.bodyHtml) {
      toast.warning('Please fill in Template Name, Subject, and Body Content.');
      return;
    }

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: templateFormData.id ? 'update' : 'create',
          userId: currentUser.id,
          companyId: currentUser.company_id || 1,
          templateId: templateFormData.id,
          name: templateFormData.name,
          subject: templateFormData.subject,
          category: templateFormData.category,
          bodyHtml: templateFormData.bodyHtml,
          bodyText: templateFormData.bodyHtml.replace(/<[^>]+>/g, ''),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTemplateModal(false);
        setTemplateFormData({ id: null, name: '', subject: '', category: 'General', bodyHtml: '' });
        fetchTemplates(currentUser.id, currentUser.company_id);
        toast.success(data.message || 'Template saved successfully!');
      } else {
        toast.error(data.message || 'Failed to save template');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving template');
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this email template?')) return;
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', templateId }),
      });
      const data = await res.json();
      if (data.success && currentUser?.id) {
        fetchTemplates(currentUser.id);
        toast.success('Template deleted');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRoles = async (companyId?: number) => {
    try {
      const cid = companyId || currentUser?.company_id || 1;
      const res = await fetch(`/api/roles?companyId=${cid}`);
      const data = await res.json();
      if (data.success) {
        setCompanyRoles(data.roles || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      toast.warning('Role name is required');
      return;
    }

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: roleForm.id ? 'update' : 'create',
          roleId: roleForm.id,
          companyId: currentUser?.company_id || 1,
          name: roleForm.name.trim(),
          description: roleForm.description,
          permissions: roleForm.permissions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRoleModal(false);
        setRoleForm({
          id: null,
          name: '',
          description: '',
          permissions: {
            canSwitchMailbox: false,
            canSendBulk: false,
            canDeleteMail: true,
            canManageFolders: true,
            canAddDomains: false,
            canEditDomains: false,
            canDeleteDomains: false,
            canCreateTemplates: false,
            canEditTemplates: false,
            canDeleteTemplates: false,
            canAccessRestApi: false,
            canCreateMailboxes: false,
            canEditMailboxes: false,
            canDeleteMailboxes: false,
          },
        });
        fetchRoles(currentUser?.company_id);
        if (currentUser?.id) fetchMailboxes(currentUser.id, currentUser.company_id);
        toast.success(data.message || 'Role and permissions saved successfully!');
      } else {
        toast.error(data.message || 'Failed to save role');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving role');
    }
  };

  const handleUpdateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDomainModal?.id || !editDomainName.trim()) return;

    try {
      const res = await fetch('/api/domains', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: editDomainModal.id,
          name: editDomainName.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditDomainModal(null);
        setEditDomainName('');
        if (currentUser?.id) fetchDomains(currentUser.id, currentUser.company_id);
        toast.success(data.message || 'Domain updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update domain');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating domain');
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('Are you sure you want to delete this role? Users assigned to this role will lose their custom permissions.')) return;
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', roleId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchRoles(currentUser?.company_id);
        if (currentUser?.id) fetchMailboxes(currentUser.id, currentUser.company_id);
        toast.success(data.message || 'Role deleted');
      } else {
        toast.error(data.message || 'Failed to delete role');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting role');
    }
  };

  const handleApplyTemplateToCompose = (tpl: any) => {
    setComposeData((prev) => ({
      ...prev,
      subject: tpl.subject,
      bodyHtml: tpl.body_html,
      bodyText: tpl.body_html.replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]+>/g, ''),
    }));
    setComposeModal(true);
    toast.success(`Applied template: "${tpl.name}" to compose window!`);
  };

  const fetchApiKeys = async (userId: number) => {
    try {
      const res = await fetch(`/api/v1/keys?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setApiKeys(data.apiKeys || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !newKeyName.trim()) return;

    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          userId: currentUser.id,
          name: newKeyName.trim(),
          senderEmail: newKeySender.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setJustGeneratedKey(data.apiKey.api_key);
        setNewKeyName('');
        setNewKeySender('');
        fetchApiKeys(currentUser.id);
        toast.success('API Key generated successfully! Copy it now.');
      } else {
        toast.error(data.message || 'Failed to create API key');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error generating API key');
    }
  };

  const handleRevokeApiKey = async (keyId: number) => {
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', keyId }),
      });
      const data = await res.json();
      if (data.success && currentUser?.id) {
        fetchApiKeys(currentUser.id);
        toast.info('API Key has been revoked');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteApiKey = async (keyId: number) => {
    if (!confirm('Are you sure you want to permanently delete this API key?')) return;
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', keyId }),
      });
      const data = await res.json();
      if (data.success && currentUser?.id) {
        fetchApiKeys(currentUser.id);
        toast.success('API Key deleted');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCloudflareZoneFile = (dom: any) => {
    const domainName = dom.name;
    const cleanDkim = dom.dkim_public_key
      ? dom.dkim_public_key.replace(/-----[^\n]+-----|\n|\r/g, '').trim()
      : '';

    const zoneFileContent = `; ========================================================
; Cloudflare / Standard BIND DNS Zone Export for ${domainName}
; Generated by MailBox Pro for ${domainName}
; ========================================================

; --- Mail Exchange (MX) Routing ---
${domainName}.        300    IN    MX    10    mail.kidukart.com.

; --- SPF Sender Authorization ---
${domainName}.        300    IN    TXT    "v=spf1 ip4:62.72.12.195 ~all"

; --- DKIM Cryptographic Key ---
mail._domainkey.${domainName}. 300 IN TXT "v=DKIM1; k=rsa; p=${cleanDkim}"

; --- DMARC Anti-Spoofing Policy ---
_dmarc.${domainName}. 300    IN    TXT    "v=DMARC1; p=none; sp=none;"
`;

    const blob = new Blob([zoneFileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${domainName}-cloudflare-dns-records.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Cloudflare DNS Zone File for ${domainName} downloaded!`);
  };

  const fetchSubUsers = async (parentId: number) => {
    try {
      const res = await fetch(`/api/sub-users?parentId=${parentId}`);
      const data = await res.json();
      if (data.success) {
        setSubUsers(data.subUsers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Webmail messages & folders when mailbox or folder changes
  useEffect(() => {
    if (selectedMailbox?.id) {
      fetchMessages(selectedMailbox.id);
      fetchOrganization(currentUser?.id, selectedMailbox.id);
    } else {
      setMessages([]);
      setSelectedMessage(null);
    }
  }, [selectedMailbox, currentFolder, activeCustomFolder, activeLabel]);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      if (data.success && data.plans.length > 0) {
        setPlans(data.plans);
        setSelectedPlanForRegistration(data.plans[1] || data.plans[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDomains = async (userId: number, companyId?: number) => {
    try {
      let url = `/api/domains?userId=${userId}`;
      if (companyId) url += `&companyId=${companyId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDomains(data.domains);
        if (data.domains.length > 0 && !newMailboxData.domainId) {
          setNewMailboxData((prev) => ({ ...prev, domainId: data.domains[0].id.toString() }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMailboxes = async (userId: number, companyId?: number) => {
    try {
      let url = `/api/mailboxes?userId=${userId}`;
      if (companyId) url += `&companyId=${companyId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMailboxes(data.mailboxes);
        if (data.mailboxes.length > 0) {
          setSelectedMailbox((prev: any) => prev || data.mailboxes[0]);
        } else {
          setSelectedMailbox(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrganization = async (userId?: number, mailboxId?: number) => {
    try {
      let url = '/api/webmail/organization?';
      if (userId) url += `userId=${userId}&`;
      if (mailboxId) url += `mailboxId=${mailboxId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCustomFolders(data.folders || []);
        setCustomLabels(data.labels || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (mailboxId: number) => {
    setLoadingMessages(true);
    try {
      let url = `/api/webmail/messages?mailboxId=${mailboxId}&q=${encodeURIComponent(searchQuery)}`;
      if (activeCustomFolder) {
        url += `&customFolderId=${activeCustomFolder.id}`;
      } else if (activeLabel) {
        url += `&labelId=${activeLabel.id}`;
      } else {
        url += `&folder=${currentFolder}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        setStorageUsage(data.storageUsage || { used_kb: 0, total_msgs: 0 });
        if (data.starredTotal !== undefined) {
          setStarredTotal(data.starredTotal);
        }
        setSelectedMessageIds([]);
        if (data.messages.length > 0) {
          setSelectedMessage(data.messages[0]);
        } else {
          setSelectedMessage(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchBulkData = async (userId: number) => {
    try {
      const res = await fetch(`/api/bulk-mail?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns);
        setContactLists(data.lists);
        if (data.lists.length > 0 && !bulkData.listId) {
          setBulkData((prev) => ({ ...prev, listId: data.lists[0].id.toString() }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Auth Handlers (Multi-Tenant SaaS with Super Admin Approval Gate)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: regForm.companyName,
          businessEmail: regForm.businessEmail || regForm.email,
          phone: regForm.phone,
          address: regForm.address,
          name: regForm.name,
          email: regForm.email,
          password: regForm.password,
          planId: selectedPlanForRegistration?.id || 1,
          paymentMethod: regForm.paymentMethod,
          transactionId: regForm.transactionId || 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.pendingApproval) {
          // Store notice details to show success/pending modal
          setRegistrationSuccessNotice({
            companyName: regForm.companyName,
            invoiceNumber: data.invoiceNumber,
            adminEmail: regForm.email,
            planName: selectedPlanForRegistration?.name || 'Selected Plan',
          });
          toast.success(data.message || 'Registration submitted! Awaiting Super Admin review.');
        } else {
          localStorage.setItem('mailbox_user', JSON.stringify(data.user));
          setCurrentUser(data.user);
        }
      } else {
        setAuthError(data.message);
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('mailbox_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        if (data.user.role === 'mailbox_user') {
          setSelectedMailbox({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.name,
            signature: data.user.signature,
            quota_mb: data.user.quota_mb,
          });
          setActiveTab('webmail');
        }
      } else {
        setAuthError(data.message);
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mailbox_user');
    setCurrentUser(null);
    setDomains([]);
    setMailboxes([]);
    setMessages([]);
    setSelectedMailbox(null);
    setSelectedMessage(null);
    setAuthMode('login');
  };

  // Mail Actions: Toggle Star, Move, Permanently Delete
  const handleToggleStar = async (messageId: number, currentStarred: boolean) => {
    try {
      const res = await fetch('/api/webmail/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_star', messageId, isStarred: !currentStarred }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, is_starred: !currentStarred ? 1 : 0 } : m))
        );
        if (selectedMessage?.id === messageId) {
          setSelectedMessage((prev: any) => ({ ...prev, is_starred: !currentStarred ? 1 : 0 }));
        }
        if (selectedMailbox?.id) {
          // refresh counts
          const countRes = await fetch(`/api/webmail/messages?mailboxId=${selectedMailbox.id}&folder=starred`);
          const countData = await countRes.json();
          if (countData.starredTotal !== undefined) {
            setStarredTotal(countData.starredTotal);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkMove = async (targetFolder: string) => {
    if (selectedMessageIds.length === 0) return;
    try {
      const res = await fetch('/api/webmail/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_move', messageIds: selectedMessageIds, folder: targetFolder }),
      });
      const data = await res.json();
      if (data.success && selectedMailbox) {
        setSelectedMessageIds([]);
        fetchMessages(selectedMailbox.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMessageIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedMessageIds.length} email(s)?`)) return;
    try {
      const res = await fetch('/api/webmail/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_delete', messageIds: selectedMessageIds }),
      });
      const data = await res.json();
      if (data.success && selectedMailbox) {
        setSelectedMessageIds([]);
        fetchMessages(selectedMailbox.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveMessage = async (messageId: number, targetFolder: string) => {
    try {
      const res = await fetch('/api/webmail/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move', messageId, folder: targetFolder }),
      });
      const data = await res.json();
      if (data.success && selectedMailbox) {
        fetchMessages(selectedMailbox.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePermanent = async (messageId: number) => {
    if (!confirm('Are you sure you want to permanently delete this email?')) return;
    try {
      const res = await fetch('/api/webmail/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', messageId }),
      });
      const data = await res.json();
      if (data.success && selectedMailbox) {
        fetchMessages(selectedMailbox.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Custom Folder & Label creation
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeBox = selectedMailbox || mailboxes[0];
    if (!activeBox?.id) {
      toast.warning('Please create or select an email mailbox first before adding custom folders.');
      return;
    }
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch('/api/webmail/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'folder',
          mailboxId: activeBox.id,
          name: newFolderName.trim(),
          color: newFolderColor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateFolderModal(false);
        setNewFolderName('');
        fetchOrganization(currentUser?.id, activeBox.id);
        toast.success(`Folder "${newFolderName}" created successfully!`);
      } else {
        toast.error(data.message || 'Failed to create folder');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating folder');
    }
  };

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !newLabelName) return;

    try {
      const res = await fetch('/api/webmail/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'label',
          userId: currentUser.id,
          name: newLabelName,
          color: newLabelColor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateLabelModal(false);
        setNewLabelName('');
        fetchOrganization(currentUser.id, selectedMailbox?.id);
        toast.success(`Label "${newLabelName}" created successfully!`);
      } else {
        toast.error(data.message || 'Failed to create label');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating label');
    }
  };

  // Compose & Schedule handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeBox = selectedMailbox || mailboxes[0];
    if (!activeBox) {
      toast.error('No sender mailbox available.');
      return;
    }

    // Resolve final To, CC, and BCC recipient lists from tags + current inputs
    const finalTo = Array.from(
      new Set([
        ...composeData.toTags,
        ...(composeData.toInput.trim() ? [composeData.toInput.trim()] : []),
        ...(composeData.to ? composeData.to.split(/[,;]/).map((s) => s.trim()) : []),
      ])
    ).filter((s) => s.includes('@')).join(', ');

    const finalCc = Array.from(
      new Set([
        ...composeData.ccTags,
        ...(composeData.ccInput.trim() ? [composeData.ccInput.trim()] : []),
        ...(composeData.cc ? composeData.cc.split(/[,;]/).map((s) => s.trim()) : []),
      ])
    ).filter((s) => s.includes('@')).join(', ');

    const finalBcc = Array.from(
      new Set([
        ...composeData.bccTags,
        ...(composeData.bccInput.trim() ? [composeData.bccInput.trim()] : []),
        ...(composeData.bcc ? composeData.bcc.split(/[,;]/).map((s) => s.trim()) : []),
      ])
    ).filter((s) => s.includes('@')).join(', ');

    if (!finalTo) {
      toast.warning('Please enter at least one recipient email address in To.');
      return;
    }

    try {
      const res = await fetch('/api/webmail/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isScheduling ? 'schedule' : 'send',
          mailboxId: activeBox.id,
          to: finalTo,
          cc: finalCc,
          bcc: finalBcc,
          subject: composeData.subject,
          bodyText: composeData.bodyText,
          scheduledAt: isScheduling ? composeData.scheduledAt : null,
          bodyHtml: composeData.bodyHtml || `<div style="font-family: sans-serif; font-size: 14px; line-height: 1.6;">${composeData.bodyText.replace(/\n/g, '<br/>')}</div>`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setComposeModal(false);
        setComposeData({
          to: '',
          cc: '',
          bcc: '',
          toTags: [],
          ccTags: [],
          bccTags: [],
          toInput: '',
          ccInput: '',
          bccInput: '',
          subject: '',
          bodyText: '',
          bodyHtml: '',
          priority: 'normal',
          scheduledAt: '',
        });
        setIsScheduling(false);
        setShowCc(false);
        setShowBcc(false);
        fetchMessages(activeBox.id);
        toast.success(data.message || (isScheduling ? 'Email scheduled successfully!' : 'Email sent successfully!'));
      } else {
        toast.error(data.message || 'Failed to dispatch email');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error sending email');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !newGroupName.trim()) return;

    // Parse CSV lines: email, name, company
    const lines = newGroupCsv.split('\n');
    const contacts = [];
    for (const line of lines) {
      const parts = line.split(',').map(s => s.trim());
      if (parts[0] && parts[0].includes('@')) {
        contacts.push({
          email: parts[0],
          name: parts[1] || '',
          company: parts[2] || '',
        });
      }
    }

    try {
      const res = await fetch('/api/bulk-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_list',
          userId: currentUser.id,
          name: newGroupName.trim(),
          contacts,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateGroupModal(false);
        setNewGroupName('');
        setNewGroupCsv('');
        fetchBulkData(currentUser.id);
        toast.success(data.message || 'Contact group saved successfully!');
      } else {
        toast.error(data.message || 'Failed to create group');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating group');
    }
  };

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    const activeBox = selectedMailbox || mailboxes[0];
    if (!activeBox) {
      toast.warning('Please create a mailbox first to send bulk emails.');
      return;
    }

    try {
      const res = await fetch('/api/bulk-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_campaign',
          userId: currentUser.id,
          mailboxId: activeBox.id,
          listId: bulkData.listId,
          title: bulkData.title,
          subject: bulkData.subject,
          bodyHtml: bulkData.bodyHtml,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBulkModal(false);
        fetchBulkData(currentUser.id);
        fetchMessages(activeBox.id);
        toast.success(data.message || 'Bulk campaign dispatched into queue!');
      } else {
        toast.error(data.message || 'Failed to launch campaign');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error launching campaign');
    }
  };

  const handleCreateSubUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    try {
      const res = await fetch('/api/sub-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          parentId: currentUser.id,
          name: subUserForm.name,
          email: subUserForm.email,
          password: subUserForm.password,
          permissions: subUserForm.permissions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubUserModal(false);
        setSubUserForm({
          name: '',
          email: '',
          password: '',
          permissions: {
            canSendBulk: false,
            canDeleteMail: true,
            canManageFolders: true,
            canManageTags: true,
            canManageDomains: false,
            canManageMailboxes: false,
          },
        });
        fetchSubUsers(currentUser.id);
        toast.success(data.message || 'Sub-user created successfully!');
      } else {
        toast.error(data.message || 'Failed to create sub-user');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating sub-user');
    }
  };

  const handleDeleteSubUser = async (subUserId: number) => {
    if (!confirm('Are you sure you want to remove this sub-user?')) return;
    try {
      const res = await fetch('/api/sub-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', subUserId }),
      });
      const data = await res.json();
      if (data.success && currentUser?.id) {
        fetchSubUsers(currentUser.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminData = async () => {
    try {
      const res = await fetch('/api/admin');
      const data = await res.json();
      if (data.success) {
        setAdminCompanies(data.companies || []);
        setAdminUsers(data.users || []);
        setAdminPlans(data.plans || []);
        setAdminInvoices(data.invoices || []);
        setAdminStats(data.stats || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveCompany = async (companyId: number) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_company', companyId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminData();
        toast.success(data.message || 'Company approved and activated successfully!');
      } else {
        toast.error(data.message || 'Failed to approve company');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error approving company');
    }
  };

  const handleUpdateCompanyStatus = async (companyId: number, newStatus: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_company_status', companyId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminData();
        toast.success(data.message || `Company status updated to ${newStatus}`);
      } else {
        toast.error(data.message || 'Failed to update company');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating company');
    }
  };

  const handleAdminChangeCompanyPlan = async (companyId: number, planId: number) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin_change_company_plan', companyId, planId }),
      });
      const data = await res.json();
      if (data.success) {
        setCompanyPlanModal(null);
        fetchAdminData();
        if (currentUser?.id) fetchBilling(currentUser.id);
        toast.success(data.message || 'Company package updated and invoice created!');
      } else {
        toast.error(data.message || 'Failed to update package');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating package');
    }
  };

  const handleSuperAdminCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyFormData.companyName || !newCompanyFormData.adminName || !newCompanyFormData.adminEmail || !newCompanyFormData.adminPassword) {
      toast.warning('Please fill in Company Name, Admin Name, Email, and Password.');
      return;
    }
    const targetPlanId = newCompanyFormData.planId || (plans[0]?.id ? String(plans[0].id) : '1');

    setCreateCompanyLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_create_company',
          companyName: newCompanyFormData.companyName,
          businessEmail: newCompanyFormData.businessEmail,
          phone: newCompanyFormData.phone,
          address: newCompanyFormData.address,
          adminName: newCompanyFormData.adminName,
          adminEmail: newCompanyFormData.adminEmail,
          adminPassword: newCompanyFormData.adminPassword,
          planId: targetPlanId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateCompanyModal(false);
        setNewCompanyFormData({
          companyName: '',
          businessEmail: '',
          phone: '',
          address: '',
          adminName: '',
          adminEmail: '',
          adminPassword: '',
          planId: '',
        });
        fetchAdminData();
        toast.success(data.message || 'Company created and activated successfully!');
      } else {
        toast.error(data.message || 'Failed to create company');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating company');
    } finally {
      setCreateCompanyLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId: number, newStatus: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_user_status', userId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminData();
        toast.success(data.message || 'User status updated');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating user');
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_plan', ...planFormData }),
      });
      const data = await res.json();
      if (data.success) {
        setPlanModal(false);
        fetchAdminData();
        fetchPlans();
        toast.success(data.message || 'Plan package saved successfully!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving plan');
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainInput.trim() || !currentUser?.id) return;

    // Realtime Domain Limit Check
    if (currentUser.max_domains && domains.length >= currentUser.max_domains) {
      toast.warning(`⚠️ Domain limit reached! Your current plan allows maximum ${currentUser.max_domains} domain(s). Please upgrade your package.`);
      return;
    }

    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDomainInput, userId: currentUser.id }),
      });
      const data = await res.json();
      if (data.success) {
        setNewDomainInput('');
        fetchDomains(currentUser.id);
        setSelectedDomainDns(data.domain);
        toast.success(`Domain ${newDomainInput} added! Configure DNS records below.`);
      } else {
        toast.error(data.message || 'Failed to add domain');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error adding domain');
    }
  };

  const handleDeleteDomain = async (domainId: number, domainName: string) => {
    if (!confirm(`Are you sure you want to delete domain "${domainName}"? All associated mailboxes and aliases under this domain will also be deleted.`)) return;
    try {
      const res = await fetch(`/api/domains?domainId=${domainId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (currentUser?.id) fetchDomains(currentUser.id, currentUser.company_id);
        if (selectedDomainDns?.id === domainId) setSelectedDomainDns(null);
        toast.success(`Domain ${domainName} deleted successfully`);
      } else {
        toast.error(data.message || 'Failed to delete domain');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting domain');
    }
  };

  const handleVerifyDns = async (domainId: number) => {
    setVerifyingDns(true);
    try {
      const res = await fetch('/api/domains/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId }),
      });
      const data = await res.json();
      if (data.success) {
        if (currentUser?.id) fetchDomains(currentUser.id, currentUser.company_id);
        if (data.isVerified) {
          toast.success(data.message || 'Domain verified! MX and SPF are properly configured on Cloudflare.');
        } else {
          toast.warning(data.message || 'DNS records not detected yet on Cloudflare or missing.');
        }
      } else {
        toast.error(data.message || 'Error checking DNS');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error connecting to DNS verifier');
    } finally {
      setVerifyingDns(false);
    }
  };

  const handleCreateMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    // Realtime Mailbox Limit Check
    if (currentUser.max_mailboxes && mailboxes.length >= currentUser.max_mailboxes) {
      toast.warning(`⚠️ Mailbox limit reached! Your current package allows maximum ${currentUser.max_mailboxes} email accounts. Please upgrade your subscription.`);
      return;
    }

    try {
      const res = await fetch('/api/mailboxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newMailboxData, userId: currentUser.id }),
      });
      const data = await res.json();
      if (data.success) {
        setNewMailboxModal(false);
        setNewMailboxData({ username: '', password: '', fullName: '', signature: '', quotaMb: 2048, roleId: '', domainId: domains[0]?.id?.toString() || '' });
        fetchMailboxes(currentUser.id);
        toast.success(`Success! Created mailbox: ${data.mailbox.email}`);
      } else {
        toast.error(data.message || 'Failed to create mailbox');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating mailbox');
    }
  };

  const handleUpdateMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMailboxModal?.id) return;

    try {
      const res = await fetch('/api/mailboxes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mailboxId: editMailboxModal.id,
          fullName: editMailboxForm.fullName,
          signature: editMailboxForm.signature,
          quotaMb: editMailboxForm.quotaMb,
          password: editMailboxForm.password || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditMailboxModal(null);
        if (currentUser?.id) fetchMailboxes(currentUser.id, currentUser.company_id);
        toast.success(data.message || 'Mailbox quota and signature updated!');
      } else {
        toast.error(data.message || 'Failed to update mailbox');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating mailbox');
    }
  };

  // Storage warning threshold calculation
  const maxQuotaMb = selectedMailbox?.quota_mb || currentUser?.storage_quota_mb || 2048;
  const usedMb = (storageUsage.used_kb / 1024);
  const usagePercent = Math.min(100, Math.round((usedMb / maxQuotaMb) * 100));
  const isStorageCritical = usagePercent >= 85;

  if (authChecking) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Loading MailBox Pro...
      </div>
    );
  }

  // =========================================================================
  // GUEST / AUTH SCREEN (REGISTER WITH PLAN & PAYMENT OR LOGIN)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans">
        <header className="border-b border-slate-800/80 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">MailBox Pro</h1>
              <p className="text-[11px] text-blue-400 font-medium">Enterprise Webmail & Cloud Email Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-2 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-900 border border-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>

            {authMode === 'register' ? (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
                className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 transition-colors"
              >
                Already have an account? Sign In
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('register');
                  setAuthStep('select_plan');
                  setAuthError('');
                }}
                className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors shadow-md shadow-blue-600/30"
              >
                Get Started (Register)
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          {authMode === 'login' ? (
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-white">Sign In to MailBox</h2>
                <p className="text-xs text-slate-400 mt-1">Super Admin or User Credentials</p>
                <div className="mt-2 text-[11px] text-blue-400 bg-blue-500/10 py-1.5 px-2 rounded border border-blue-500/20">
                  Super Admin: <strong>admin@mailserver.local</strong> / <strong>admin123</strong>
                </div>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email Address</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="admin@mailserver.local"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 pl-10 pr-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 pl-10 pr-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Sign In'}
                </button>
              </form>
            </div>
          ) : authStep === 'select_plan' ? (
            <div className="w-full max-w-6xl py-4 space-y-16">
              {/* HERO SECTION */}
              <div className="text-center space-y-6 pt-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Next-Gen Enterprise Mail Server & Multi-Tenant SaaS Platform</span>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
                  Lightning Fast, Secure & <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                    Self-Hosted Professional Mailboxes
                  </span>
                </h1>

                <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                  Send, receive, and manage business emails under your own custom domains. Featuring high-deliverability Postfix SMTP, Dovecot IMAP, REST API for web apps, and modern Webmail.
                </p>

                <div className="flex items-center justify-center gap-4 pt-2 flex-wrap">
                  <a
                    href="#pricing"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2"
                  >
                    <span>Get Started Today</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError('');
                    }}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-sm font-semibold rounded-xl transition-all"
                  >
                    Sign In to Webmail
                  </button>
                </div>
              </div>

              {/* LIVE FEATURE HIGHLIGHTS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all shadow-lg space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Custom Domain Freedom</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Connect unlimited domains via Cloudflare or cPanel without modifying your website IP. Automatic DKIM, SPF & DMARC DNS generation.
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all shadow-lg space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">REST API & Next.js / PHP SDK</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Send transactional emails directly from your website or eCommerce apps with a single HTTP POST request. Zero complex SMTP configurations.
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all shadow-lg space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Flexible Quota & Sub-Users</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Allocate custom GB storage quotas per mailbox. Grant team members granular role permissions with individual email signatures.
                  </p>
                </div>
              </div>

              {/* PRICING SECTION */}
              <div id="pricing" className="pt-6 space-y-8">
                <div className="text-center space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    Transparent Pricing Plans
                  </span>
                  <h2 className="text-3xl font-extrabold text-white">Choose the Right Plan for Your Business</h2>
                  <p className="text-sm text-slate-400">Scale your communication infrastructure effortlessly with zero lock-in contracts.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => {
                    const isSelected = selectedPlanForRegistration?.id === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanForRegistration(plan)}
                        className={`bg-slate-900 rounded-2xl p-7 border cursor-pointer transition-all flex flex-col justify-between relative ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-2xl shadow-blue-500/20 bg-slate-900'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {plan.price_monthly > 15 && (
                          <span className="absolute -top-3 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow">
                            Most Popular
                          </span>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                            {isSelected && <Check className="w-5 h-5 text-blue-400" />}
                          </div>
                          <div className="mt-2 mb-6">
                            <span className="text-4xl font-extrabold text-white">${plan.price_monthly}</span>
                            <span className="text-xs text-slate-400"> / month</span>
                          </div>
                          <ul className="space-y-3.5 text-xs text-slate-300">
                            <li className="flex items-center gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>Max <strong>{plan.max_domains}</strong> Custom Domain(s)</span>
                            </li>
                            <li className="flex items-center gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>Max <strong>{plan.max_mailboxes}</strong> User Accounts</span>
                            </li>
                            <li className="flex items-center gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span><strong>{plan.storage_quota_mb / 1024} GB</strong> Cloud Storage</span>
                            </li>
                            <li className="flex items-center gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span><strong>{plan.bulk_mail_daily_limit}</strong> Bulk Emails/day</span>
                            </li>
                            <li className="flex items-center gap-2.5 text-slate-400">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>REST API & Webhooks Access</span>
                            </li>
                          </ul>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlanForRegistration(plan);
                            setAuthStep('payment_register');
                          }}
                          className={`w-full mt-8 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            isSelected
                              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          <span>Select Plan & Continue</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ENTERPRISE TRUST & SECURITY FOOTER BADGE */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Enterprise Privacy & Security</h4>
                    <p className="text-[11px] text-slate-400">Fully compliant with SPF, DKIM, DMARC, and TLS 1.3 encryption.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-xs">
                  <span>🔒 99.9% Uptime Guarantee</span>
                  <span>•</span>
                  <span>⚡ 24/7 Server Monitoring</span>
                </div>
              </div>
            </div>
          ) : registrationSuccessNotice ? (
            /* Success / Pending Approval Screen */
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-5">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  Registration Awaiting Approval
                </span>
                <h2 className="text-2xl font-bold text-white mt-3">Company Account Created</h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-sm mx-auto">
                  Thank you for registering <strong>{registrationSuccessNotice.companyName}</strong>! Your account and initial subscription invoice ({registrationSuccessNotice.invoiceNumber}) have been submitted to Super Admin for verification.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Selected Package:</span>
                  <strong className="text-blue-400">{registrationSuccessNotice.planName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Admin Email:</span>
                  <strong className="text-white font-mono">{registrationSuccessNotice.adminEmail}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Invoice Reference:</span>
                  <strong className="text-amber-400 font-mono">{registrationSuccessNotice.invoiceNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Initial Status:</span>
                  <span className="text-amber-400 font-bold">Pending Review (Unpaid)</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Once Super Admin verifies and activates your company, you will be able to log in immediately.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationSuccessNotice(null);
                    setAuthMode('login');
                    setAuthError('');
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    Step 2: Company & Account Info
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">Register SaaS Organization</h2>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Selected Package:</span>
                  <p className="text-sm font-bold text-blue-400">{selectedPlanForRegistration?.name} (${selectedPlanForRegistration?.price_monthly}/mo)</p>
                </div>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                {/* 1. Company Information */}
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>Company / Business Details</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Company / Organization Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Acme Technologies Ltd"
                        value={regForm.companyName}
                        onChange={(e) => setRegForm({ ...regForm, companyName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Business Email / Website</label>
                      <input
                        type="text"
                        placeholder="info@acme.com"
                        value={regForm.businessEmail}
                        onChange={(e) => setRegForm({ ...regForm, businessEmail: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Contact Phone</label>
                      <input
                        type="text"
                        placeholder="+1 (555) 019-2834"
                        value={regForm.phone}
                        onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Business Address</label>
                      <input
                        type="text"
                        placeholder="City, Country"
                        value={regForm.address}
                        onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Main Admin User Information */}
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span>Primary Company Administrator</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Admin Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={regForm.name}
                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Login Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="admin@acme.com"
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Admin Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* 3. Payment Reference */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span>Payment Gateway & Transaction Reference</span>
                  </label>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {['card', 'bkash', 'bank_transfer'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setRegForm({ ...regForm, paymentMethod: method })}
                        className={`py-2 text-xs font-semibold rounded-lg border capitalize transition-all ${
                          regForm.paymentMethod === method
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {method === 'bkash' ? 'bKash / Nagad' : method.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
                    <label className="block text-[11px] text-slate-400 mb-1">Transaction ID / Payment Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. TRX-9041824 or Card Auth Ref"
                      value={regForm.transactionId}
                      onChange={(e) => setRegForm({ ...regForm, transactionId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white rounded font-mono"
                    />
                    <p className="text-[10px] text-amber-400 mt-1">
                      ⚠️ Note: Registration will create an unpaid invoice. Super Admin must verify and approve your registration before your company account becomes active.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAuthStep('select_plan')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ← Back to Packages
                  </button>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                  >
                    {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : `Submit Registration & Invoice`}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN DASHBOARD INTERFACE
  // =========================================================================
  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* 1. Global Navigation Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Logo & User Info */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-bold text-base text-white truncate">MailBox Pro</h1>
                <p className="text-[11px] text-emerald-400 font-medium truncate">{currentUser.plan_name || 'Active'}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80">
              {currentUser.company_name && (
                <div className="mb-2 px-2 py-1 bg-slate-800/80 rounded-lg border border-slate-700/60 flex items-center gap-1.5 text-xs text-amber-300">
                  <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-bold truncate text-[11px]">{currentUser.company_name}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="text-xs truncate max-w-[130px]">
                  <p className="font-semibold text-slate-200 truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {currentUser.role === 'admin' || currentUser.role === 'superadmin' ? '⚡ Super Admin' : currentUser.email}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleTheme}
                    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                    className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
                  </button>
                  <button
                    onClick={handleLogout}
                    title="Log Out"
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => {
                setActiveTab('overview');
                if (currentUser?.id) fetchBilling(currentUser.id);
                if (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') fetchAdminData();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('webmail');
                setActiveCustomFolder(null);
                setActiveLabel(null);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'webmail' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Webmail Client</span>
            </button>

            {/* Domains Tab (Visible if Admin or has Domain permissions) */}
            {(currentUser.role !== 'mailbox_user' || currentUser?.permissions?.canAddDomains || currentUser?.permissions?.canEditDomains || currentUser?.permissions?.canDeleteDomains) && (
              <button
                onClick={() => setActiveTab('domains')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'domains' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Custom Domains</span>
                <span className="ml-auto text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">{domains.length}</span>
              </button>
            )}

            {/* Mailboxes Tab (Visible if Admin or has Mailbox permissions) */}
            {(currentUser.role !== 'mailbox_user' || currentUser?.permissions?.canCreateMailboxes || currentUser?.permissions?.canEditMailboxes || currentUser?.permissions?.canDeleteMailboxes) && (
              <button
                onClick={() => setActiveTab('mailboxes')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'mailboxes' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Mailboxes (Users)</span>
                <span className="ml-auto text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                  {mailboxes.length}{currentUser.max_mailboxes ? `/${currentUser.max_mailboxes}` : ''}
                </span>
              </button>
            )}

            {/* Bulk Mail Campaign Tab */}
            {(currentUser.role !== 'mailbox_user' || currentUser?.permissions?.canSendBulk) && (
              <button
                onClick={() => setActiveTab('bulk')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'bulk' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Bulk Mail Campaign</span>
              </button>
            )}

            {/* REST API Access Tab */}
            {(currentUser.role !== 'mailbox_user' || currentUser?.permissions?.canAccessRestApi) && (
              <button
                onClick={() => {
                  setActiveTab('apikeys');
                  if (currentUser?.id) fetchApiKeys(currentUser.id);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'apikeys' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>Email REST API</span>
                <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">v1</span>
              </button>
            )}

            {/* Email Templates Tab (Always visible or guarded by canCreateTemplates/canEditTemplates) */}
            <button
              onClick={() => {
                setActiveTab('templates');
                if (currentUser?.id) fetchTemplates(currentUser.id);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'templates' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Email Templates</span>
              <span className="ml-auto text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">{emailTemplates.length}</span>
            </button>

            {currentUser.role !== 'mailbox_user' && (
              <button
                onClick={() => {
                  setActiveTab('billing');
                  if (currentUser?.id) fetchBilling(currentUser.id);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'billing' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Receipt className="w-4 h-4 text-amber-400" />
                <span>Billing & Invoices</span>
                {billingSummary?.pendingUpgrade && (
                  <span className="ml-auto text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold animate-pulse">
                    Pending
                  </span>
                )}
              </button>
            )}

            {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
              <button
                onClick={() => {
                  setActiveTab('superadmin');
                  fetchAdminData();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'superadmin' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Super Admin Panel</span>
              </button>
            )}

            <button
              onClick={() => {
                setActiveTab('settings');
                if (currentUser?.id) fetchSettings(currentUser.id);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Settings2 className="w-4 h-4 text-slate-400" />
              <span>Settings & Profile</span>
            </button>
          </nav>
        </div>

        {/* Storage Bar & Quota Warnings */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
            <span className="flex items-center gap-1.5 text-slate-300">
              <HardDrive className="w-3.5 h-3.5" /> Storage Quota
            </span>
            <span className={isStorageCritical ? 'text-rose-400 font-bold' : 'text-slate-400'}>
              {usedMb.toFixed(1)} MB / {maxQuotaMb} MB
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
            <div
              className={`h-full transition-all ${
                isStorageCritical ? 'bg-rose-500' : usagePercent > 60 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.max(4, usagePercent)}%` }}
            />
          </div>

          {isStorageCritical && (
            <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded text-[10px] text-rose-300 flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Storage nearly full! Clean trash or upgrade package.</span>
            </div>
          )}

          {/* Mailbox Switcher (Only visible if company admin, superadmin, or user has canSwitchMailbox permission) */}
          {(currentUser.role !== 'mailbox_user' || currentUser?.permissions?.canSwitchMailbox) && mailboxes.length > 1 ? (
            <div className="mt-2">
              <label className="block text-[10px] text-slate-400 font-semibold mb-1">Switch Active Mailbox</label>
              <select
                value={selectedMailbox?.id || ''}
                onChange={(e) => {
                  const found = mailboxes.find((m) => m.id === Number(e.target.value));
                  setSelectedMailbox(found || null);
                }}
                className="w-full bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {mailboxes.map((mb) => (
                  <option key={mb.id} value={mb.id}>
                    {mb.email}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mt-2 text-[11px] font-mono text-slate-400 truncate bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              ✉ {selectedMailbox?.email || currentUser.email}
            </div>
          )}
        </div>
      </aside>

      {/* 2. Main Content Dynamic Section */}
      <main className="flex-1 flex overflow-hidden">
        {/* ===================== VIEW 0: DASHBOARD OVERVIEW (TENANT & SUPER ADMIN) ===================== */}
        {activeTab === 'overview' && (
          <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-6 h-6 text-blue-400" />
                    <h2 className="text-2xl font-bold text-white">
                      {currentUser.role === 'admin' || currentUser.role === 'superadmin' ? 'Super Admin Executive Overview' : `${currentUser.company_name || 'Company'} Dashboard`}
                    </h2>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Real-time resource utilization, mail send/receive quotas, extra charges, and system health.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (currentUser?.id) fetchBilling(currentUser.id);
                      if (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') fetchAdminData();
                      toast.success('Dashboard metrics refreshed');
                    }}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-800 flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh Metrics
                  </button>
                  <button
                    onClick={() => setActiveTab('webmail')}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/25 flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" /> Open Webmail
                  </button>
                </div>
              </div>

              {/* SECTION A: Monthly Send & Receive Limit and Overage Tracking Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Monthly Mail Quotas & Overage System</h3>
                      <p className="text-xs text-slate-400">
                        Package: <strong className="text-blue-400">{billingSummary?.currentPlan?.name || currentUser.plan_name || 'Standard Plan'}</strong> (${billingSummary?.currentPlan?.price || 19.99}/mo)
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">Estimated Next Month Invoice:</span>
                    <span className="text-xl font-black text-white">
                      ${billingSummary?.usage?.nextMonthEstimatedBill || (billingSummary?.currentPlan?.price || 19.99)}
                    </span>
                    {Number(billingSummary?.usage?.totalCurrentOverage || 0) > 0 && (
                      <span className="text-[10px] text-amber-400 font-bold block">
                        (+${billingSummary?.usage?.totalCurrentOverage} overage accumulated)
                      </span>
                    )}
                  </div>
                </div>

                {/* 2 Big Gauge Progress Bars for Send & Receive */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Send Mail Quota */}
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                        <span>Monthly Send Limit</span>
                      </span>
                      <span className="font-mono text-slate-200">
                        <strong>{billingSummary?.usage?.monthSentCount || 0}</strong> / {billingSummary?.currentPlan?.sendLimit || 500} sent
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {(() => {
                      const limit = billingSummary?.currentPlan?.sendLimit || 500;
                      const count = billingSummary?.usage?.monthSentCount || 0;
                      const pct = Math.min(100, Math.round((count / limit) * 100));
                      const isOver = count > limit;
                      return (
                        <>
                          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden mb-2">
                            <div
                              className={`h-full transition-all ${isOver ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{pct}% of quota used</span>
                            <span className={isOver ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                              {isOver
                                ? `⚠️ Over limit by ${billingSummary?.usage?.extraSent} mails (+$${billingSummary?.usage?.extraSendCharge} billed next month)`
                                : `Extra mail rate: $${billingSummary?.currentPlan?.extraSendRate || 0.05}/mail`}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Receive Mail Quota */}
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <ArrowDownLeft className="w-4 h-4 text-blue-400" />
                        <span>Monthly Receive Limit</span>
                      </span>
                      <span className="font-mono text-slate-200">
                        <strong>{billingSummary?.usage?.monthReceivedCount || 0}</strong> / {billingSummary?.currentPlan?.receiveLimit || 1000} received
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {(() => {
                      const limit = billingSummary?.currentPlan?.receiveLimit || 1000;
                      const count = billingSummary?.usage?.monthReceivedCount || 0;
                      const pct = Math.min(100, Math.round((count / limit) * 100));
                      const isOver = count > limit;
                      return (
                        <>
                          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden mb-2">
                            <div
                              className={`h-full transition-all ${isOver ? 'bg-amber-500' : 'bg-blue-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{pct}% of quota used</span>
                            <span className={isOver ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                              {isOver
                                ? `⚠️ Over limit by ${billingSummary?.usage?.extraReceived} mails (+$${billingSummary?.usage?.extraReceiveCharge} billed next month)`
                                : `Extra mail rate: $${billingSummary?.currentPlan?.extraReceiveRate || 0.02}/mail`}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <p className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>System ensures zero downtime: emails beyond your plan limit are delivered seamlessly, with overage added to your next invoice.</span>
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab('billing');
                      setUpgradeModal(true);
                    }}
                    className="text-amber-400 hover:text-amber-300 font-bold underline"
                  >
                    Need higher limits? Upgrade Plan →
                  </button>
                </div>
              </div>

              {/* SECTION B: Multi-Tenant Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">Custom Domains</span>
                    <Globe className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{domains.length}</div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Limit: {billingSummary?.currentPlan?.maxDomains || currentUser.max_domains || 1}
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">Active Mailboxes</span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{mailboxes.length}</div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Limit: {billingSummary?.currentPlan?.maxMailboxes || currentUser.max_mailboxes || 5}
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">Storage Consumption</span>
                    <HardDrive className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{usedMb.toFixed(1)} MB</div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Allocated: {maxQuotaMb} MB ({usagePercent}% used)
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">Sub-Users & Roles</span>
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{subUsers.length}</div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Tenant team members
                  </span>
                </div>
              </div>

              {/* SECTION C: Recent Invoices & Quick Download Access */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Recent Invoices & Payment Receipts</h3>
                      <p className="text-[11px] text-slate-400">Download and print official billing invoices</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('billing')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    View All Invoices →
                  </button>
                </div>

                {userInvoices.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">No invoices generated yet.</div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {userInvoices.slice(0, 3).map((inv) => (
                      <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-mono font-bold text-[10px]">
                            INV
                          </div>
                          <div>
                            <span className="font-bold text-white font-mono">{inv.invoice_number}</span>
                            <span className="text-slate-400 text-[11px] block">
                              {new Date(inv.created_at).toLocaleDateString()} • {inv.plan_name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="font-bold text-white text-sm">${inv.amount}</span>
                            <span className={`block text-[10px] font-bold ${
                              inv.status === 'approved' ? 'text-emerald-400' : inv.status === 'pending' ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              {inv.status === 'approved' ? 'Paid & Active' : inv.status === 'pending' ? 'Pending Approval' : 'Rejected'}
                            </span>
                          </div>

                          <button
                            onClick={() => setInvoiceViewModal(inv)}
                            className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Invoice</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== VIEW 1: WEBMAIL CLIENT ===================== */}
        {activeTab === 'webmail' && (
          <div className="flex-1 flex w-full overflow-hidden">
            {/* Folder & Labels sidebar */}
            <div className="w-60 bg-slate-900/70 border-r border-slate-800 p-3 flex flex-col justify-between shrink-0 overflow-y-auto">
              <div>
                <button
                  onClick={() => {
                    if (mailboxes.length === 0) {
                      toast.warning('Please create a mailbox first in the Mailboxes tab.');
                      setActiveTab('mailboxes');
                      return;
                    }
                    const activeBox = selectedMailbox || mailboxes[0];
                    const activeSignature = activeBox?.signature || companySettingsForm.emailSignature || '';
                    const defaultFooter = companySettingsForm.emailFooter ? `\n\n---\n${companySettingsForm.emailFooter}` : '';
                    
                    if (activeSignature || defaultFooter) {
                      const initialBodyText = `\n\n${activeSignature}${defaultFooter}`;
                      const initialBodyHtml = `<br/><br/><div style="color: #64748b; font-size: 13px; font-family: sans-serif; border-top: 1px solid #cbd5e1; padding-top: 8px;">${activeSignature.replace(/\n/g, '<br/>')}${companySettingsForm.emailFooter ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 8px;">${companySettingsForm.emailFooter.replace(/\n/g, '<br/>')}</div>` : ''}</div>`;
                      setComposeData((prev) => ({
                        ...prev,
                        bodyText: prev.bodyText || initialBodyText,
                        bodyHtml: prev.bodyHtml || initialBodyHtml,
                      }));
                    }
                    setComposeModal(true);
                  }}
                  className="w-full mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-2.5 px-4 rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Compose Mail</span>
                </button>

                {/* Standard Folders */}
                <div className="space-y-1 mb-4">
                  {[
                    { id: 'inbox', label: 'Inbox', icon: Inbox },
                    { id: 'starred', label: 'Starred', icon: Star, count: starredTotal },
                    { id: 'sent', label: 'Sent', icon: Send },
                    { id: 'drafts', label: 'Drafts / Scheduled', icon: Clock },
                    { id: 'spam', label: 'Spam', icon: AlertOctagon },
                    { id: 'trash', label: 'Trash', icon: Trash2 },
                    { id: 'archive', label: 'Archive', icon: Archive },
                  ].map((folder) => {
                    const Icon = folder.icon;
                    const isActive = currentFolder === folder.id && !activeCustomFolder && !activeLabel;
                    return (
                      <button
                        key={folder.id}
                        onClick={() => {
                          setCurrentFolder(folder.id);
                          setActiveCustomFolder(null);
                          setActiveLabel(null);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive ? 'bg-slate-800 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${folder.id === 'starred' && isActive ? 'text-amber-400 fill-amber-400' : ''}`} />
                          <span>{folder.label}</span>
                        </div>
                        {folder.count !== undefined && folder.count > 0 && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-bold">
                            {folder.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Folders Section */}
                <div className="pt-3 border-t border-slate-800/80 mb-4">
                  <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Custom Folders</span>
                    {(currentUser?.role !== 'sub_user' || currentUser?.permissions?.canManageFolders) && (
                      <button
                        onClick={() => setCreateFolderModal(true)}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                        title="Create New Folder"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {customFolders.map((f) => {
                      const isActive = activeCustomFolder?.id === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => {
                            setActiveCustomFolder(f);
                            setActiveLabel(null);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isActive ? 'bg-slate-800 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                          }`}
                        >
                          <Folder className="w-3.5 h-3.5" style={{ color: f.color }} />
                          <span className="truncate">{f.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Labels Section */}
                <div className="pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Labels</span>
                    {(currentUser?.role !== 'sub_user' || currentUser?.permissions?.canManageTags) && (
                      <button
                        onClick={() => setCreateLabelModal(true)}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                        title="Create New Label"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {customLabels.map((l) => {
                      const isActive = activeLabel?.id === l.id;
                      return (
                        <button
                          key={l.id}
                          onClick={() => {
                            setActiveLabel(l);
                            setActiveCustomFolder(null);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isActive ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                          }`}
                        >
                          <Tag className="w-3.5 h-3.5" style={{ color: l.color }} />
                          <span className="truncate">{l.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Email list pane */}
            <div className="w-80 border-r border-slate-800 flex flex-col shrink-0 bg-slate-900/30">
              <div className="p-3 border-b border-slate-800">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search in folder..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && selectedMailbox && fetchMessages(selectedMailbox.id)}
                    className="w-full bg-slate-800/60 border border-slate-700/60 pl-9 pr-3 py-1.5 text-xs rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Bulk Action Toolbar (Gmail Style) */}
              <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={messages.length > 0 && selectedMessageIds.length === messages.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMessageIds(messages.map((m) => m.id));
                      } else {
                        setSelectedMessageIds([]);
                      }
                    }}
                    className="w-3.5 h-3.5 rounded text-blue-600 bg-slate-800 border-slate-700"
                    title="Select All"
                  />
                  <span className="text-[11px] text-slate-400">
                    {selectedMessageIds.length > 0 ? `${selectedMessageIds.length} selected` : 'Select All'}
                  </span>
                </div>

                {selectedMessageIds.length > 0 && (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <button
                      onClick={() => handleBulkMove('archive')}
                      title="Archive Selected"
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    {(currentUser?.role !== 'sub_user' || currentUser?.permissions?.canDeleteMail) && (
                      <>
                        <button
                          onClick={() => handleBulkMove('trash')}
                          title="Move Selected to Trash"
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleBulkDelete}
                          title="Permanently Delete Selected"
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
                {loadingMessages ? (
                  <div className="p-8 text-center text-xs text-slate-500">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    {mailboxes.length === 0 ? 'Create a mailbox first' : 'No emails found.'}
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => setSelectedMessage(msg)}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedMessage?.id === msg.id ? 'bg-blue-600/10 border-l-2 border-blue-500' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedMessageIds.includes(msg.id)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMessageIds((prev) => [...prev, msg.id]);
                              } else {
                                setSelectedMessageIds((prev) => prev.filter((id) => id !== msg.id));
                              }
                            }}
                            className="w-3.5 h-3.5 rounded text-blue-600 bg-slate-800 border-slate-700 cursor-pointer"
                          />
                          {/* Gmail Style Star Toggle Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStar(msg.id, Boolean(msg.is_starred));
                            }}
                            title={msg.is_starred ? 'Starred' : 'Not starred'}
                            className="p-0.5 text-slate-500 hover:text-amber-400 transition-colors"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                msg.is_starred ? 'text-amber-400 fill-amber-400' : 'text-slate-500 hover:text-amber-400'
                              }`}
                            />
                          </button>
                          <span className={`text-xs truncate max-w-[130px] ${!msg.is_read ? 'font-bold text-white' : 'text-slate-300'}`}>
                            {msg.sender_name || msg.sender}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h4 className={`text-xs truncate mb-1 pl-6 ${!msg.is_read ? 'font-semibold text-slate-200' : 'text-slate-400'}`}>
                        {msg.subject || '(No Subject)'}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1 pl-6">{msg.snippet || 'No preview available'}</p>
                      {msg.is_scheduled === 1 && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400 pl-6">
                          <Calendar className="w-3 h-3" /> Scheduled: {new Date(msg.scheduled_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Email reader pane */}
            <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
              {selectedMessage ? (
                <div className="p-6 max-w-4xl">
                  <div className="flex items-start justify-between border-b border-slate-800 pb-5 mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">{selectedMessage.subject}</h2>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="font-semibold text-slate-200">From: {selectedMessage.sender_name || selectedMessage.sender}</span>
                        <span>•</span>
                        <span>To: {selectedMessage.recipients}</span>
                        <span>•</span>
                        <span>{new Date(selectedMessage.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    {/* Action buttons: Star, Header Info (Show Original), Archive, Trash, Spam, Permanent Delete */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setMessageHeadersModal(selectedMessage)}
                        title="View Full Email Headers & Diagnostic Info (cPanel / Gmail Style)"
                        className="p-2 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold"
                      >
                        <Info className="w-4 h-4 text-blue-400" />
                        <span className="hidden sm:inline">Header Info</span>
                      </button>

                      <button
                        onClick={() => handleToggleStar(selectedMessage.id, Boolean(selectedMessage.is_starred))}
                        title={selectedMessage.is_starred ? 'Unstar Message' : 'Star Message'}
                        className="p-2 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            selectedMessage.is_starred ? 'text-amber-400 fill-amber-400' : 'text-slate-400'
                          }`}
                        />
                      </button>

                      <button
                        onClick={() => handleMoveMessage(selectedMessage.id, 'archive')}
                        title="Archive Email"
                        className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <Archive className="w-4 h-4" />
                      </button>

                      {currentUser?.role !== 'sub_user' || currentUser?.permissions?.canDeleteMail ? (
                        <>
                          <button
                            onClick={() => handleMoveMessage(selectedMessage.id, 'trash')}
                            title="Move to Trash"
                            className="p-2 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveMessage(selectedMessage.id, 'spam')}
                            title="Mark as Spam"
                            className="p-2 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <AlertOctagon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePermanent(selectedMessage.id)}
                            title="Delete Permanently"
                            className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic bg-slate-900 px-2 py-1 rounded border border-slate-800">
                          Delete permission restricted
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: selectedMessage.body_html || `<p>${selectedMessage.body_text || ''}</p>`,
                    }}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                  <Mail className="w-12 h-12 stroke-1 mb-3 text-slate-700" />
                  <p className="text-sm">Select an email from the list to read</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== VIEW 2: SUPER ADMIN PANEL ===================== */}
        {activeTab === 'superadmin' && currentUser.role === 'admin' && (
          <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-purple-400" /> Super Admin Control Center
                  </h2>
                  <p className="text-sm text-slate-400">
                    Manage users, approve/activate subscription payments, and configure packages & quotas.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPlanFormData({
                      id: null,
                      name: '',
                      slug: '',
                      price_monthly: 29.99,
                      max_domains: 5,
                      max_mailboxes: 20,
                      storage_quota_mb: 10240,
                      bulk_mail_daily_limit: 2500,
                    });
                    setPlanModal(true);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-lg shadow-purple-600/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Package</span>
                </button>
              </div>

              {/* Stats Grid */}
              {adminStats && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400">Total Users</span>
                    <p className="text-2xl font-bold text-white mt-1">{adminStats.total_users}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400">Active Domains</span>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{adminStats.total_domains}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400">Total Mailboxes</span>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{adminStats.total_mailboxes}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400">Total Emails Processed</span>
                    <p className="text-2xl font-bold text-amber-400 mt-1">{adminStats.total_messages}</p>
                  </div>
                </div>
              )}

              {/* Users & Subscription Approval Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="text-sm font-semibold text-white">Registered Users & Subscriptions</h3>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Plan</th>
                      <th className="p-3.5">Usage / Limits</th>
                      <th className="p-3.5">Storage</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {adminUsers.map((u) => {
                      const storageMb = ((u.used_kb || 0) / 1024).toFixed(1);
                      return (
                        <tr key={u.id} className="hover:bg-slate-800/40">
                          <td className="p-3.5">
                            <p className="font-semibold text-white">{u.name}</p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </td>
                          <td className="p-3.5 font-medium text-blue-400">{u.plan_name || 'Free'}</td>
                          <td className="p-3.5">
                            <span>{u.domain_count}/{u.max_domains || 1} Domains</span> •{' '}
                            <span>{u.mailbox_count}/{u.max_mailboxes || 5} Mailboxes</span>
                          </td>
                          <td className="p-3.5">
                            <span>{storageMb} MB / {u.storage_quota_mb || 2048} MB</span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {u.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {u.status === 'pending' ? (
                              <button
                                onClick={() => handleUpdateUserStatus(u.id, 'active')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-[11px]"
                              >
                                Approve & Activate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateUserStatus(u.id, u.status === 'active' ? 'suspended' : 'active')}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[11px]"
                              >
                                {u.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Package Configuration */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Configured Subscription Packages</h3>
                <div className="grid grid-cols-3 gap-4">
                  {adminPlans.map((p) => (
                    <div key={p.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-white text-sm">{p.name}</h4>
                        <span className="font-bold text-emerald-400">${p.price_monthly}/mo</span>
                      </div>
                      <ul className="text-xs text-slate-400 space-y-1">
                        <li>• Max Domains: <strong>{p.max_domains}</strong></li>
                        <li>• Max Accounts: <strong>{p.max_mailboxes}</strong></li>
                        <li>• Cloud Space: <strong>{p.storage_quota_mb / 1024} GB</strong></li>
                        <li>• Daily Bulk Limit: <strong>{p.bulk_mail_daily_limit}</strong></li>
                      </ul>
                      <button
                        onClick={() => {
                          setPlanFormData(p);
                          setPlanModal(true);
                        }}
                        className="w-full mt-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700"
                      >
                        Edit Package
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== VIEW 3: DOMAINS ===================== */}
        {activeTab === 'domains' && (
          <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
            <div className="max-w-5xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Custom Domain Management</h2>
                <p className="text-sm text-slate-400">
                  Add your domain and configure DNS (MX, SPF, DKIM, DMARC) for seamless mailbox creation and deliverability.
                </p>
              </div>

              {/* Add domain form (permission enforced: Admin or canAddDomains) */}
              {(currentUser?.role !== 'mailbox_user' || currentUser?.permissions?.canAddDomains) ? (
                <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 shadow-sm">
                  <form onSubmit={handleAddDomain} className="flex gap-3">
                    <div className="flex-1 relative">
                      <Globe className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. yourcompany.com"
                        value={newDomainInput}
                        onChange={(e) => setNewDomainInput(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 pl-10 pr-4 py-2.5 text-sm rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/30"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Domain</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Domain registration is restricted for your role permissions.
                </div>
              )}

              {/* Domain list */}
              <div className="space-y-4">
                {domains.map((dom) => (
                  <div key={dom.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-white">{dom.name}</h3>
                            {dom.is_verified ? (
                              <span className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Verified
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                                <Clock className="w-3 h-3" /> DNS Pending
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{dom.mailbox_count || 0} Mailboxes created</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVerifyDns(dom.id)}
                          disabled={verifyingDns}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${verifyingDns ? 'animate-spin' : ''}`} />
                          <span>Check DNS</span>
                        </button>
                        <button
                          onClick={() => setSelectedDomainDns(dom)}
                          className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-xs font-medium text-blue-400 rounded-lg border border-blue-500/30 transition-colors"
                        >
                          DNS Guide
                        </button>

                        {/* EDIT DOMAIN BUTTON (Admin or canEditDomains) */}
                        {(currentUser.role !== 'mailbox_user' || currentUser?.permissions?.canEditDomains) && (
                          <button
                            onClick={() => {
                              setEditDomainModal(dom);
                              setEditDomainName(dom.name);
                            }}
                            title="Edit Domain Name"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
                          >
                            <Settings2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* DELETE DOMAIN BUTTON (Admin or canDeleteDomains) */}
                        {(currentUser.role !== 'mailbox_user' || currentUser?.permissions?.canDeleteDomains) && (
                          <button
                            onClick={() => handleDeleteDomain(dom.id, dom.name)}
                            title={`Delete domain ${dom.name}`}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {selectedDomainDns?.id === dom.id && (
                      <div className="mt-5 pt-5 border-t border-slate-800/80">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              <span>Required DNS Setup Guide for</span>
                              <span className="text-blue-400 font-mono underline">{dom.name}</span>
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Add these records at your DNS provider (Cloudflare, Namecheap, cPanel). <strong>No need to change your main website IP!</strong>
                            </p>
                          </div>
                          <button
                            onClick={() => handleExportCloudflareZoneFile(dom)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold rounded-lg shadow flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Download standard BIND DNS zone file for 1-click import into Cloudflare"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-950" />
                            <span>Export for Cloudflare (.txt)</span>
                          </button>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 p-1">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                              <tr>
                                <th className="p-3">Record Type</th>
                                <th className="p-3">Host / Name</th>
                                <th className="p-3">Target / Value</th>
                                <th className="p-3">Priority / TTL</th>
                                <th className="p-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/80 font-mono text-slate-300">
                              {/* MX Record */}
                              <tr className="hover:bg-slate-900/50 transition-colors">
                                <td className="p-3 text-blue-400 font-bold">MX</td>
                                <td className="p-3">@</td>
                                <td className="p-3 font-semibold text-white">mail.kidukart.com</td>
                                <td className="p-3">Priority: <strong className="text-amber-400">10</strong></td>
                                <td className="p-3 text-right font-sans">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText('mail.kidukart.com');
                                      toast.success('MX target copied!');
                                    }}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded font-medium inline-flex items-center gap-1"
                                  >
                                    <Copy className="w-3 h-3" /> Copy
                                  </button>
                                </td>
                              </tr>

                              {/* SPF Record */}
                              <tr className="hover:bg-slate-900/50 transition-colors">
                                <td className="p-3 text-emerald-400 font-bold">TXT (SPF)</td>
                                <td className="p-3">@</td>
                                <td className="p-3 text-emerald-300">v=spf1 ip4:62.72.12.195 ~all</td>
                                <td className="p-3 text-slate-400">Auto</td>
                                <td className="p-3 text-right font-sans">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText('v=spf1 ip4:62.72.12.195 ~all');
                                      toast.success('SPF record copied!');
                                    }}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded font-medium inline-flex items-center gap-1"
                                  >
                                    <Copy className="w-3 h-3" /> Copy
                                  </button>
                                </td>
                              </tr>

                              {/* DKIM Record */}
                              <tr className="hover:bg-slate-900/50 transition-colors">
                                <td className="p-3 text-purple-400 font-bold">TXT (DKIM)</td>
                                <td className="p-3">mail._domainkey</td>
                                <td className="p-3 truncate max-w-xs text-purple-300">
                                  {dom.dkim_public_key ? `v=DKIM1; k=rsa; p=${dom.dkim_public_key.replace(/-----[^\n]+-----|\n|\r/g, '').trim()}` : 'v=DKIM1; k=rsa; p=...'}
                                </td>
                                <td className="p-3 text-slate-400">Auto</td>
                                <td className="p-3 text-right font-sans">
                                  <button
                                    onClick={() => {
                                      const dkimVal = dom.dkim_public_key
                                        ? `v=DKIM1; k=rsa; p=${dom.dkim_public_key.replace(/-----[^\n]+-----|\n|\r/g, '').trim()}`
                                        : 'v=DKIM1; k=rsa; p=...';
                                      navigator.clipboard.writeText(dkimVal);
                                      toast.success('DKIM record copied!');
                                    }}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded font-medium inline-flex items-center gap-1"
                                  >
                                    <Copy className="w-3 h-3" /> Copy
                                  </button>
                                </td>
                              </tr>

                              {/* DMARC Record */}
                              <tr className="hover:bg-slate-900/50 transition-colors">
                                <td className="p-3 text-amber-400 font-bold">TXT (DMARC)</td>
                                <td className="p-3">_dmarc</td>
                                <td className="p-3 text-amber-300">v=DMARC1; p=none; sp=none;</td>
                                <td className="p-3 text-slate-400">Auto</td>
                                <td className="p-3 text-right font-sans">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText('v=DMARC1; p=none; sp=none;');
                                      toast.success('DMARC record copied!');
                                    }}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded font-medium inline-flex items-center gap-1"
                                  >
                                    <Copy className="w-3 h-3" /> Copy
                                  </button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="mt-3 p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl text-xs text-slate-300 leading-relaxed">
                          <p className="flex items-center gap-1.5 font-semibold text-blue-400 mb-1">
                            <span>💡 Cloudflare Setup Tip:</span>
                          </p>
                          <p>
                            • Set <strong>Proxy status</strong> to <strong>DNS Only (Gray Cloud ☁️)</strong> for MX and TXT records.<br/>
                            • Your main website (A or CNAME record) does NOT need to be changed and can stay on Vercel/Shopify/etc.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== VIEW 4: MAILBOXES ===================== */}
        {activeTab === 'mailboxes' && (
          <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Professional Email Accounts</h2>
                  <p className="text-sm text-slate-400">
                    Accounts created: {mailboxes.length} of {currentUser.max_mailboxes || 5} allowed.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  {currentUser.role !== 'mailbox_user' && (
                    <button
                      onClick={() => {
                        fetchRoles(currentUser.company_id);
                        setRoleModal(true);
                      }}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                      <span>Manage Roles ({companyRoles.length})</span>
                    </button>
                  )}

                  {(currentUser?.role !== 'sub_user' || currentUser?.permissions?.canManageMailboxes) ? (
                    <button
                      onClick={() => setNewMailboxModal(true)}
                      disabled={domains.length === 0}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-600/25"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Mailbox</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                      Mailbox provisioning restricted
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950 text-slate-400 text-xs border-b border-slate-800">
                    <tr>
                      <th className="p-4">Email Address</th>
                      <th className="p-4">Full Name</th>
                      <th className="p-4">Assigned Role</th>
                      <th className="p-4">Storage Quota</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {mailboxes.map((mb) => (
                      <tr key={mb.id} className="hover:bg-slate-800/40">
                        <td className="p-4 font-semibold text-white flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-400" />
                          <span>{mb.email}</span>
                        </td>
                        <td className="p-4">{mb.full_name || '-'}</td>
                        <td className="p-4">
                          <span className={`text-[11px] px-2 py-0.5 rounded font-medium border ${
                            mb.role_name ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {mb.role_name || 'Standard User'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-white">{(mb.quota_mb / 1024).toFixed(1)} GB</span>
                          <span className="text-[11px] text-slate-400 block font-mono">({mb.quota_mb} MB)</span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                            Active
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedMailbox(mb);
                                setActiveTab('webmail');
                              }}
                              className="px-3 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-xs rounded font-medium transition-colors"
                            >
                              Open Webmail
                            </button>
                            <button
                              onClick={() => {
                                setEditMailboxModal(mb);
                                setEditMailboxForm({
                                  fullName: mb.full_name || '',
                                  signature: mb.signature || '',
                                  quotaMb: mb.quota_mb || 2048,
                                  roleId: mb.role_id ? mb.role_id.toString() : '',
                                  password: '',
                                });
                              }}
                              title="Edit Storage Quota & Signature"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 text-xs transition-colors flex items-center gap-1"
                            >
                              <Settings2 className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Edit / Space</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== VIEW 5: BULK CAMPAIGNS & GROUPS ===================== */}
        {activeTab === 'bulk' && (
          <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Bulk Email Campaigns & Contact Groups</h2>
                  <p className="text-sm text-slate-400">
                    Create contact groups, personalize emails using dynamic tags, and dispatch in throttled queues.
                  </p>
                </div>
                <div className="flex gap-2">
                  {(currentUser?.role !== 'sub_user' || currentUser?.permissions?.canSendBulk) ? (
                    <>
                      <button
                        onClick={() => setCreateGroupModal(true)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 border border-slate-700"
                      >
                        <Users className="w-4 h-4 text-blue-400" />
                        <span>Create Contact Group</span>
                      </button>
                      <button
                        onClick={() => {
                          if (contactLists.length === 0) {
                            toast.warning('Please create at least one Contact Group first before launching a campaign.');
                            setCreateGroupModal(true);
                            return;
                          }
                          setBulkData((prev) => ({ ...prev, listId: contactLists[0].id.toString() }));
                          setBulkModal(true);
                        }}
                        disabled={mailboxes.length === 0}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/25"
                      >
                        <Send className="w-4 h-4" />
                        <span>Compose Bulk Campaign</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center">
                      Bulk mail dispatching restricted for this user
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Groups List */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" /> Your Contact Groups ({contactLists.length})
                  </h3>
                  <button
                    onClick={() => setCreateGroupModal(true)}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    + Add New Group
                  </button>
                </div>

                {contactLists.length === 0 ? (
                  <div className="p-6 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                    No contact groups created yet. Click &quot;Create Contact Group&quot; to add emails for bulk campaigns.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {contactLists.map((grp) => (
                      <div key={grp.id} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{grp.name}</span>
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-medium border border-blue-500/20">
                              {grp.contact_count} contacts
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1 truncate max-w-xs">
                            Sample: {grp.contacts?.slice(0, 3).map((c: any) => c.email).join(', ') || 'No contacts yet'}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setBulkData((prev) => ({ ...prev, listId: grp.id.toString() }));
                            setBulkModal(true);
                          }}
                          className="px-3 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs rounded font-medium transition-colors"
                        >
                          Send to Group
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Campaigns history */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="text-sm font-semibold text-white">Recent Dispatched Campaigns</h3>
                </div>
                {campaigns.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">No bulk campaigns launched yet.</div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {campaigns.map((c) => (
                      <div key={c.id} className="p-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-white">{c.title}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Sender: {c.sender_email} • Group: {c.list_name} • Total: {c.total_recipients} emails
                          </p>
                        </div>
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
                          {c.status.toUpperCase()} ({c.sent_count}/{c.total_recipients})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== VIEW 6: SUB-USERS & ROLE PERMISSIONS ===================== */}
        {(activeTab as any) === 'subusers' && (
          <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Sub-Users & Role Permissions</h2>
                  <p className="text-sm text-slate-400">
                    Create sub-user accounts with custom granular permissions (Bulk Send, Delete Mail, Folders, Tags, Domains, Mailboxes).
                  </p>
                </div>
                <button
                  onClick={() => setSubUserModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/25"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Sub-User</span>
                </button>
              </div>

              {/* Sub-users list */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Active Sub-Users ({subUsers.length})</h3>
                </div>

                {subUsers.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-500">
                    No sub-users created yet. Click &quot;Create Sub-User&quot; to add team members with restricted permissions.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {subUsers.map((su) => (
                      <div key={su.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{su.name}</span>
                            <span className="text-xs text-slate-400">({su.email})</span>
                            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-semibold">
                              Sub-User
                            </span>
                          </div>

                          {/* Permission Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                              su.permissions?.canSendBulk ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                            }`}>
                              Bulk Send
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                              su.permissions?.canDeleteMail ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                            }`}>
                              Delete Mail
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                              su.permissions?.canManageFolders ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                            }`}>
                              Folders
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                              su.permissions?.canManageTags ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                            }`}>
                              Tags / Labels
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                              su.permissions?.canManageDomains ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                            }`}>
                              Domains
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                              su.permissions?.canManageMailboxes ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                            }`}>
                              Create/Delete Mailboxes
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteSubUser(su.id)}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs rounded-lg transition-colors"
                          >
                            Delete User
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== VIEW: EMAIL REST API & DEVELOPER KEYS ===================== */}
        {activeTab === 'apikeys' && (
          <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white">Email REST API & Developer Keys</h2>
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold rounded">
                      No SMTP Needed
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Send emails programmatically from your website, CRM, or backend by making a simple HTTP POST request to our REST API endpoint.
                  </p>
                </div>
                <button
                  onClick={() => setNewKeyModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate New API Key</span>
                </button>
              </div>

              {/* Just Generated Key Banner */}
              {justGeneratedKey && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl animate-fadeIn">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Your New API Key (Save it now!)
                    </span>
                    <button
                      onClick={() => setJustGeneratedKey(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900/90 p-2.5 rounded-lg border border-slate-700">
                    <code className="text-xs font-mono text-emerald-300 flex-1 select-all break-all">
                      {justGeneratedKey}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(justGeneratedKey);
                        toast.success('API Key copied to clipboard!');
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    For security, you won't be able to see the full key again. Store it securely in your website's environment variables.
                  </p>
                </div>
              )}

              {/* API Keys Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                    <span>Active API Keys</span>
                  </h3>
                  <span className="text-xs text-slate-400">{apiKeys.length} key(s) configured</span>
                </div>

                {apiKeys.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <KeyRound className="w-10 h-10 mx-auto mb-3 opacity-30 text-emerald-400" />
                    <p className="text-sm font-medium">No API keys generated yet.</p>
                    <p className="text-xs text-slate-500 mt-1">Generate an API key to start sending emails from your website without SMTP.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {apiKeys.map((k) => (
                      <div key={k.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{k.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              k.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {k.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                            <span>Key: <code className="font-mono text-slate-300">{k.api_key.substring(0, 14)}••••••••••</code></span>
                            <span>Sender: <strong className="text-slate-300">{k.sender_email || 'Any verified mailbox'}</strong></span>
                            <span>Requests: <strong className="text-slate-300">{k.total_requests || 0}</strong></span>
                            <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(k.api_key);
                              toast.success('API Key copied!');
                            }}
                            title="Copy Key"
                            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {k.status === 'active' && (
                            <button
                              onClick={() => handleRevokeApiKey(k.id)}
                              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs rounded-lg transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteApiKey(k.id)}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Interactive Integration Guides / Code Snippets */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white">How to Send Email from your Website (Code Examples)</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">POST /api/v1/send</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* cURL Example */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-300">cURL (HTTP / Terminal)</span>
                      <button
                        onClick={() => {
                          const curl = `curl -X POST https://your-mail-server.com/api/v1/send \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer mbx_live_your_api_key" \\
  -d '{
    "to": "customer@example.com",
    "subject": "Order Confirmation #1092",
    "html": "<h1>Thank you for your order!</h1><p>Your payment was successful.</p>"
  }'`;
                          navigator.clipboard.writeText(curl);
                          toast.success('cURL snippet copied!');
                        }}
                        className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto p-2 bg-slate-900/60 rounded leading-relaxed">
{`curl -X POST /api/v1/send \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer mbx_live_..." \\
  -d '{
    "to": "customer@example.com",
    "subject": "Order Confirmation",
    "html": "<h1>Thank you!</h1>"
  }'`}
                    </pre>
                  </div>

                  {/* Node.js / JavaScript Example */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-300">JavaScript / Node.js / Next.js (Fetch)</span>
                      <button
                        onClick={() => {
                          const js = `await fetch('https://your-mail-server.com/api/v1/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mbx_live_your_api_key'
  },
  body: JSON.stringify({
    to: 'customer@example.com',
    subject: 'Welcome to our platform',
    html: '<h1>Welcome!</h1><p>Your account is ready.</p>'
  })
});`;
                          navigator.clipboard.writeText(js);
                          toast.success('JavaScript code copied!');
                        }}
                        className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto p-2 bg-slate-900/60 rounded leading-relaxed">
{`await fetch('/api/v1/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mbx_live_...'
  },
  body: JSON.stringify({
    to: 'user@example.com',
    subject: 'Hello World',
    html: '<b>Sent via REST API!</b>'
  })
});`}
                    </pre>
                  </div>

                  {/* PHP / WordPress Example */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 lg:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-300">PHP (cURL / WordPress / Laravel)</span>
                      <button
                        onClick={() => {
                          const php = `$response = file_get_contents('https://your-mail-server.com/api/v1/send', false, stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\\r\\nAuthorization: Bearer mbx_live_your_api_key\\r\\n",
        'content' => json_encode([
            'to' => 'client@gmail.com',
            'subject' => 'Invoice #502',
            'html' => '<p>Please find your invoice attached.</p>'
        ])
    ]
]));`;
                          navigator.clipboard.writeText(php);
                          toast.success('PHP code copied!');
                        }}
                        className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto p-2 bg-slate-900/60 rounded leading-relaxed">
{`$response = wp_remote_post('https://your-mail-server.com/api/v1/send', [
    'headers' => ['Authorization' => 'Bearer mbx_live_...', 'Content-Type' => 'application/json'],
    'body'    => json_encode([
        'to'      => 'client@gmail.com',
        'subject' => 'Invoice #502',
        'html'    => '<p>Please find your invoice.</p>'
    ])
]);`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== VIEW: EMAIL TEMPLATES BUILDER ===================== */}
        {activeTab === 'templates' && (
          <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white">Email Templates Library</h2>
                    <span className="px-2 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 font-mono font-bold rounded">
                      Reusable & Tag-Supported
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Design, organize, and store reusable email templates for one-click composing, bulk marketing campaigns, or transactional notifications.
                  </p>
                </div>
                {(currentUser.role !== 'mailbox_user' || currentUser?.permissions?.canCreateTemplates) && (
                  <button
                    onClick={() => {
                      setTemplateFormData({ id: null, name: '', subject: '', category: 'General', bodyHtml: '' });
                      setTemplateModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Template</span>
                  </button>
                )}
              </div>

              {/* Templates Grid */}
              {emailTemplates.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                  <FileText className="w-12 h-12 text-indigo-400 opacity-40 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-white mb-1">No templates found</h3>
                  <p className="text-xs text-slate-400 mb-4">Create your first reusable email template to save time composing emails.</p>
                  {(currentUser.role !== 'mailbox_user' || currentUser?.permissions?.canCreateTemplates) && (
                    <button
                      onClick={() => {
                        setTemplateFormData({ id: null, name: '', subject: '', category: 'General', bodyHtml: '' });
                        setTemplateModal(true);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create Template
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {emailTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xl group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {tpl.category || 'General'}
                            </span>
                            <h3 className="text-base font-bold text-white mt-2 group-hover:text-blue-400 transition-colors">
                              {tpl.name}
                            </h3>
                          </div>
                          <Bookmark className="w-4 h-4 text-slate-500 shrink-0" />
                        </div>

                        <p className="text-xs text-slate-300 font-medium mb-3 line-clamp-1">
                          <span className="text-slate-400 font-normal">Subject:</span> {tpl.subject}
                        </p>

                        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl mb-4 max-h-36 overflow-hidden">
                          <p className="text-[11px] text-slate-400 line-clamp-4 leading-relaxed font-sans">
                            {tpl.body_text || tpl.body_html.replace(/<[^>]+>/g, '')}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          Updated {new Date(tpl.updated_at || tpl.created_at).toLocaleDateString()}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleApplyTemplateToCompose(tpl)}
                            title="Use in Compose Window"
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Send className="w-3 h-3" />
                            <span>Use</span>
                          </button>
                          {(currentUser.role !== 'mailbox_user' || currentUser?.permissions?.canEditTemplates) && (
                            <button
                              onClick={() => {
                                setTemplateFormData({
                                  id: tpl.id,
                                  name: tpl.name,
                                  subject: tpl.subject,
                                  category: tpl.category || 'General',
                                  bodyHtml: tpl.body_html,
                                });
                                setTemplateModal(true);
                              }}
                              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                              title="Edit Template"
                            >
                              <Settings2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(currentUser.role !== 'mailbox_user' || currentUser?.permissions?.canDeleteTemplates) && (
                            <button
                              onClick={() => handleDeleteTemplate(tpl.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                              title="Delete Template"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== VIEW: BILLING & INVOICES ===================== */}
        {activeTab === 'billing' && (
          <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Receipt className="w-6 h-6 text-amber-400" />
                    <span>Billing & Monthly Invoices</span>
                  </h2>
                  <p className="text-sm text-slate-400">
                    Manage your subscription plan, request package upgrades, and view verified payment receipts.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedUpgradePlan(plans[1] || plans[0]);
                    setUpgradeModal(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>Upgrade Package</span>
                </button>
              </div>

              {/* Pending Upgrade Alert Banner if user requested an upgrade */}
              {billingSummary?.pendingUpgrade && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-amber-300">
                        Package Upgrade Pending Super Admin Approval
                      </h4>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold uppercase">
                        Unpaid / In Review
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      You requested an upgrade to <strong>{billingSummary.pendingUpgrade.name} (${billingSummary.pendingUpgrade.price}/mo)</strong>.
                      Your new quotas will become active once Super Admin verifies your payment and approves the invoice.
                    </p>
                  </div>
                </div>
              )}

              {/* Current Subscription Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Active Plan</span>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                    Active Subscription
                  </span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-2xl font-extrabold text-white">
                      {billingSummary?.currentPlan?.name || currentUser.plan_name || 'Standard Plan'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Billing cycle: <strong>Monthly</strong> • Next invoice generated automatically.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-white">
                      ${billingSummary?.currentPlan?.price || currentUser.price_monthly || 0}
                      <span className="text-xs text-slate-400 font-normal"> / month</span>
                    </div>
                  </div>
                </div>

                {/* Quota breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Custom Domains</span>
                    <span className="text-base font-bold text-white">
                      {domains.length} / {billingSummary?.currentPlan?.maxDomains || currentUser.max_domains || 1}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Mailboxes</span>
                    <span className="text-base font-bold text-white">
                      {mailboxes.length} / {billingSummary?.currentPlan?.maxMailboxes || currentUser.max_mailboxes || 5}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Storage Allocated</span>
                    <span className="text-base font-bold text-white">
                      {maxQuotaMb} MB
                    </span>
                  </div>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    <span>Invoices & Billing History ({userInvoices.length})</span>
                  </h3>
                  <button
                    onClick={() => currentUser?.id && fetchBilling(currentUser.id)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>

                {userInvoices.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-500">
                    No invoices generated yet.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-4">Invoice #</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Plan Item</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Method / Trx ID</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Invoice Document</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {userInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-800/40">
                          <td className="p-4 font-mono font-bold text-white">{inv.invoice_number}</td>
                          <td className="p-4">{new Date(inv.created_at).toLocaleDateString()}</td>
                          <td className="p-4">
                            <span className="font-semibold text-white">{inv.plan_name}</span>
                            <span className="text-[10px] text-slate-400 block capitalize">Cycle: {inv.billing_cycle || 'monthly'}</span>
                          </td>
                          <td className="p-4 font-bold text-white text-sm">${inv.amount}</td>
                          <td className="p-4 font-mono text-[11px]">
                            <span className="text-slate-300 capitalize">{inv.payment_method}</span>
                            {inv.transaction_id && (
                              <span className="text-slate-500 block text-[10px]">{inv.transaction_id}</span>
                            )}
                          </td>
                          <td className="p-4">
                            {inv.status === 'approved' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                                <CheckCircle className="w-3 h-3" /> Paid & Active
                              </span>
                            )}
                            {inv.status === 'pending' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3" /> Pending Approval
                              </span>
                            )}
                            {inv.status === 'rejected' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 w-fit">
                                ✕ Rejected
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setInvoiceViewModal(inv)}
                              className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download Invoice</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== VIEW: SUPER ADMIN PANEL ===================== */}
        {activeTab === 'superadmin' && (
          <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-purple-400" />
                    <span>Super Admin Platform Control</span>
                  </h2>
                  <p className="text-sm text-slate-400">
                    Review and approve subscription invoices, activate plan upgrades, and control user access.
                  </p>
                </div>
                <button
                  onClick={() => fetchAdminData()}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
                </button>
              </div>

              {/* Stats Overview */}
              {adminStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400 block">Total Users</span>
                    <span className="text-2xl font-extrabold text-white">{adminStats.total_users || 0}</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-amber-400 font-semibold block">Pending Invoices</span>
                    <span className="text-2xl font-extrabold text-amber-400">{adminStats.pending_invoices || 0}</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400 block">Hosted Domains</span>
                    <span className="text-2xl font-extrabold text-white">{adminStats.total_domains || 0}</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400 block">Total Mailboxes</span>
                    <span className="text-2xl font-extrabold text-white">{adminStats.total_mailboxes || 0}</span>
                  </div>
                </div>
              )}

              {/* SaaS Companies (Tenants) Management Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">SaaS Companies & Tenants ({adminCompanies.length})</h3>
                      <p className="text-[11px] text-slate-400">Isolated organizations, owner accounts, and plan management</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCreateCompanyModal(true)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/25 flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New Company</span>
                    </button>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                      Multi-Tenant Isolation
                    </span>
                  </div>
                </div>

                {adminCompanies.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">No companies registered yet.</div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Company Name</th>
                        <th className="p-3.5">Owner / Admin</th>
                        <th className="p-3.5">Current Package</th>
                        <th className="p-3.5">Resources Used</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {adminCompanies.map((comp) => (
                        <tr key={comp.id} className="hover:bg-slate-800/40">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-white block text-sm">{comp.name}</span>
                                <span className="text-[11px] text-slate-400">{comp.business_email || comp.phone || 'No phone'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold text-white block">{comp.admin_name || 'Owner'}</span>
                            <span className="text-[11px] text-slate-400">{comp.admin_email}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-blue-400 block">{comp.plan_name}</span>
                            <span className="text-[10px] text-slate-500">${comp.price_monthly}/mo</span>
                          </td>
                          <td className="p-3.5">
                            <div className="space-y-0.5 text-[11px]">
                              <div><strong className="text-white">{comp.domain_count || 0}</strong> / {comp.max_domains} Domains</div>
                              <div><strong className="text-white">{comp.mailbox_count || 0}</strong> / {comp.max_mailboxes} Mailboxes</div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            {comp.status === 'active' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Active
                              </span>
                            ) : comp.status === 'pending' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                                Pending Approval
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                Suspended
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {comp.status === 'pending' && (
                                <button
                                  onClick={() => handleApproveCompany(comp.id)}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md shadow-emerald-600/30 transition-all"
                                >
                                  Approve Company
                                </button>
                              )}

                              {/* Super Admin Direct Package Upgrade */}
                              <button
                                onClick={() => setCompanyPlanModal(comp)}
                                className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold rounded-lg transition-all"
                              >
                                Change Package
                              </button>

                              {comp.status === 'active' ? (
                                <button
                                  onClick={() => handleUpdateCompanyStatus(comp.id, 'suspended')}
                                  className="px-2 py-1 text-[11px] text-amber-400 hover:bg-amber-500/10 rounded border border-amber-500/30"
                                >
                                  Suspend
                                </button>
                              ) : comp.status === 'suspended' ? (
                                <button
                                  onClick={() => handleUpdateCompanyStatus(comp.id, 'active')}
                                  className="px-2 py-1 text-[11px] text-emerald-400 hover:bg-emerald-500/10 rounded border border-emerald-500/30"
                                >
                                  Reactivate
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pending Invoices Approval Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Invoice Approval & Upgrade Requests</h3>
                  </div>
                  <span className="text-xs text-slate-400">Super Admin verification required</span>
                </div>

                {adminInvoices.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">No invoices in the system.</div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Invoice #</th>
                        <th className="p-3.5">Company / User</th>
                        <th className="p-3.5">Upgrade Plan</th>
                        <th className="p-3.5">Amount</th>
                        <th className="p-3.5">Method / Trx ID</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {adminInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-800/40">
                          <td className="p-3.5 font-mono font-bold text-white">{inv.invoice_number}</td>
                          <td className="p-3.5">
                            <span className="font-bold text-white block">{inv.company_name || inv.user_name}</span>
                            <span className="text-[11px] text-slate-400">{inv.user_email}</span>
                          </td>
                          <td className="p-3.5 font-bold text-blue-400">{inv.plan_name}</td>
                          <td className="p-3.5 font-extrabold text-white text-sm">${inv.amount}</td>
                          <td className="p-3.5 font-mono text-[11px]">
                            <span className="text-slate-300 capitalize">{inv.payment_method}</span>
                            {inv.transaction_id && (
                              <span className="text-slate-500 block text-[10px]">{inv.transaction_id}</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {inv.status === 'approved' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Approved & Active
                              </span>
                            ) : inv.status === 'pending' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                                Pending Approval
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                Rejected
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setInvoiceViewModal(inv)}
                                title="View & Download Invoice"
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded border border-slate-700 flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                <span>PDF</span>
                              </button>

                              {inv.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => handleApproveInvoice(inv.id)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors shadow-md shadow-emerald-600/30"
                                  >
                                    Approve & Activate
                                  </button>
                                  <button
                                    onClick={() => handleRejectInvoice(inv.id)}
                                    className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs rounded-lg"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <span className="text-[11px] text-slate-500">Processed</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Users management list */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white">All Platform Accounts ({adminUsers.length})</h3>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Plan</th>
                      <th className="p-3.5">Usage</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {adminUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40">
                        <td className="p-3.5">
                          <span className="font-semibold text-white block">{u.name}</span>
                          <span className="text-[11px] text-slate-400">{u.email}</span>
                        </td>
                        <td className="p-3.5 capitalize font-medium">{u.role}</td>
                        <td className="p-3.5 font-bold text-blue-400">{u.plan_name || 'Standard'}</td>
                        <td className="p-3.5">
                          <span>{u.domain_count || 0} domains</span> • <span>{u.mailbox_count || 0} mailboxes</span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {u.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {u.status === 'active' ? (
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, 'suspended')}
                              className="px-2.5 py-1 text-[11px] text-amber-400 hover:bg-amber-500/10 rounded border border-amber-500/30"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, 'active')}
                              className="px-2.5 py-1 text-[11px] text-emerald-400 hover:bg-emerald-500/10 rounded border border-emerald-500/30"
                            >
                              Activate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== VIEW: SETTINGS & PROFILE (COMPANY & USER PROFILE) ===================== */}
        {activeTab === 'settings' && (
          <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
            <div className="max-w-5xl mx-auto space-y-8">
              <div>
                <div className="flex items-center gap-2">
                  <Settings2 className="w-6 h-6 text-blue-400" />
                  <h2 className="text-2xl font-bold text-white">Settings & Profile Management</h2>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Update your organization identity, business contact information, and personal account credentials.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. COMPANY INFORMATION CARD (Only editable by Company Admin & Super Admin) */}
                {currentUser.role !== 'mailbox_user' ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">Company Information & Branding</h3>
                            <p className="text-[11px] text-slate-400">Organization profile & global footer (Admin only)</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          Admin Settings
                        </span>
                      </div>

                    <form onSubmit={handleUpdateCompanyInfo} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company / Organization Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Acme Corporation Ltd"
                          value={companySettingsForm.companyName}
                          onChange={(e) => setCompanySettingsForm({ ...companySettingsForm, companyName: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business Contact Email</label>
                        <input
                          type="email"
                          placeholder="info@acme.com"
                          value={companySettingsForm.businessEmail}
                          onChange={(e) => setCompanySettingsForm({ ...companySettingsForm, businessEmail: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contact Phone Number</label>
                        <input
                          type="text"
                          placeholder="+1 (555) 019-2834"
                          value={companySettingsForm.phone}
                          onChange={(e) => setCompanySettingsForm({ ...companySettingsForm, phone: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Office / Business Address</label>
                        <textarea
                          rows={2}
                          placeholder="123 Tech Park, Suite 400, New York, USA"
                          value={companySettingsForm.address}
                          onChange={(e) => setCompanySettingsForm({ ...companySettingsForm, address: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* EMAIL SIGNATURE EDITOR */}
                      <div className="pt-2 border-t border-slate-800/80">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-semibold text-amber-300">
                            ✍️ Default Email Signature (HTML / Text)
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">Appended to outgoing mail</span>
                        </div>
                        <textarea
                          rows={3}
                          placeholder="Best regards,&#10;Your Name | Founder & CEO&#10;Company Name (https://example.com)"
                          value={companySettingsForm.emailSignature}
                          onChange={(e) => setCompanySettingsForm({ ...companySettingsForm, emailSignature: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs font-mono text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                        />
                      </div>

                      {/* EMAIL FOOTER & LEGAL DISCLAIMER EDITOR */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-semibold text-indigo-300">
                            📜 Organization Footer & Legal Disclaimer
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">Unsubscribe / Compliance notice</span>
                        </div>
                        <textarea
                          rows={2}
                          placeholder="© 2026 Your Company. All rights reserved. If you received this email in error, please notify sender."
                          value={companySettingsForm.emailFooter}
                          onChange={(e) => setCompanySettingsForm({ ...companySettingsForm, emailFooter: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs font-mono text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                        />
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex justify-end">
                        <button
                          type="submit"
                          disabled={settingsLoading}
                          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                        >
                          {settingsLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save Company Details & Email Footer'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
                ) : null}

                {/* 2. USER PROFILE & PASSWORD CHANGE CARD */}
                <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between ${currentUser.role === 'mailbox_user' ? 'max-w-xl mx-auto col-span-2 w-full' : ''}`}>
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">User Profile & Security</h3>
                          <p className="text-[11px] text-slate-400">Personal name, email, and password changes</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                        {currentUser.role?.toUpperCase()}
                      </span>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={profileSettingsForm.name}
                          onChange={(e) => setProfileSettingsForm({ ...profileSettingsForm, name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Login Email Address</label>
                        <input
                          type="email"
                          disabled={currentUser.role === 'mailbox_user'}
                          required
                          value={profileSettingsForm.email}
                          onChange={(e) => setProfileSettingsForm({ ...profileSettingsForm, email: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 font-mono"
                        />
                      </div>

                      {/* INDIVIDUAL SIGNATURE (USER SPECIFIC) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-semibold text-amber-300">
                            ✍️ My Personal Email Signature
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">Appended when sending</span>
                        </div>
                        <textarea
                          rows={3}
                          placeholder="Best regards,&#10;Your Name | Role&#10;Direct: +880 1700-000000"
                          value={profileSettingsForm.signature || ''}
                          onChange={(e) => setProfileSettingsForm({ ...profileSettingsForm, signature: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs font-mono text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                        />
                      </div>

                      <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Change Account Password</span>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Current Password (Required for changes)</label>
                          <input
                            type="password"
                            placeholder="Enter current password"
                            value={profileSettingsForm.currentPassword}
                            onChange={(e) => setProfileSettingsForm({ ...profileSettingsForm, currentPassword: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white rounded-lg focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">New Password</label>
                            <input
                              type="password"
                              placeholder="Minimum 6 chars"
                              value={profileSettingsForm.newPassword}
                              onChange={(e) => setProfileSettingsForm({ ...profileSettingsForm, newPassword: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white rounded-lg focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">Confirm New Password</label>
                            <input
                              type="password"
                              placeholder="Repeat new password"
                              value={profileSettingsForm.confirmPassword}
                              onChange={(e) => setProfileSettingsForm({ ...profileSettingsForm, confirmPassword: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white rounded-lg focus:outline-none"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500">Leave password fields blank if you only want to update your name or email.</p>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex justify-end">
                        <button
                          type="submit"
                          disabled={settingsLoading}
                          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                        >
                          {settingsLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save Profile & Password'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===================== GMAIL-STYLE DOCKED COMPOSE WINDOW ===================== */}
      {composeModal && (
        <div className="fixed bottom-0 right-10 z-50 shadow-2xl transition-all duration-200">
          <div className={`bg-slate-900 border border-slate-700/80 rounded-t-2xl shadow-2xl overflow-hidden flex flex-col transition-all ${
            isComposeMinimized ? 'w-80 h-12' : 'w-[580px] h-[600px]'
          }`}>
            {/* Window Titlebar (Gmail Style) */}
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between select-none cursor-pointer" onClick={() => setIsComposeMinimized(!isComposeMinimized)}>
              <div className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-bold text-white">
                  {composeData.subject ? composeData.subject : 'New Message'}
                </span>
                <span className="text-[10px] text-slate-400">({selectedMailbox?.email || mailboxes[0]?.email})</span>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setIsScheduling(!isScheduling)}
                  title="Schedule Mail"
                  className={`p-1 rounded hover:bg-slate-800 ${isScheduling ? 'text-amber-400' : 'text-slate-400'}`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsComposeMinimized(!isComposeMinimized)}
                  title={isComposeMinimized ? 'Expand' : 'Minimize'}
                  className="text-slate-400 hover:text-white p-1 text-xs"
                >
                  {isComposeMinimized ? '🗖' : '—'}
                </button>
                <button
                  type="button"
                  onClick={() => setComposeModal(false)}
                  title="Close"
                  className="text-slate-400 hover:text-white p-1 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Window Body (hidden if minimized) */}
            {!isComposeMinimized && (
              <form
                onSubmit={handleSendMessage}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
                    // Prevent accidental form submit when typing recipient tags
                    const inputElem = e.target as HTMLInputElement;
                    if (inputElem.placeholder && inputElem.placeholder.includes('press Enter')) {
                      e.preventDefault();
                    }
                  }
                }}
                className="p-3 space-y-2 flex-1 flex flex-col overflow-y-auto bg-slate-900"
              >
                {/* To Field with Interactive Tag Badges (Enter / Comma to add Tag) */}
                <div
                  onClick={() => document.getElementById('compose-to-input')?.focus()}
                  className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 py-1.5 text-xs min-h-[36px] cursor-text"
                >
                  <span className="text-slate-400 font-semibold w-8 shrink-0 select-none">To:</span>
                  
                  {composeData.toTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full text-xs font-mono animate-fadeIn"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setComposeData((prev) => ({
                            ...prev,
                            toTags: prev.toTags.filter((_, i) => i !== idx),
                          }));
                        }}
                        className="text-blue-400 hover:text-white text-xs font-bold leading-none ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  <input
                    id="compose-to-input"
                    type="text"
                    placeholder={composeData.toTags.length === 0 ? "recipient@example.com (press Enter or Comma)..." : "Add more..."}
                    value={composeData.toInput}
                    onChange={(e) => setComposeData({ ...composeData, toInput: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab' || e.key === ' ') {
                        if (composeData.toInput.trim()) {
                          e.preventDefault();
                          e.stopPropagation();
                          const val = composeData.toInput.replace(/[,;\s]/g, '').trim();
                          if (val && !composeData.toTags.includes(val)) {
                            setComposeData((prev) => ({
                              ...prev,
                              toTags: [...prev.toTags, val],
                              toInput: '',
                            }));
                          }
                        }
                      } else if (e.key === 'Backspace' && !composeData.toInput && composeData.toTags.length > 0) {
                        setComposeData((prev) => ({
                          ...prev,
                          toTags: prev.toTags.slice(0, -1),
                        }));
                      }
                    }}
                    onBlur={() => {
                      if (composeData.toInput.trim()) {
                        const val = composeData.toInput.replace(/[,;\s]/g, '').trim();
                        if (val && !composeData.toTags.includes(val)) {
                          setComposeData((prev) => ({
                            ...prev,
                            toTags: [...prev.toTags, val],
                            toInput: '',
                          }));
                        }
                      }
                    }}
                    className="flex-1 min-w-[140px] bg-transparent text-white placeholder-slate-500 focus:outline-none text-xs"
                  />

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium shrink-0 ml-auto">
                    {!showCc && (
                      <button type="button" onClick={() => setShowCc(true)} className="hover:text-blue-400 px-1 py-0.5 rounded hover:bg-slate-800">
                        Cc
                      </button>
                    )}
                    {!showBcc && (
                      <button type="button" onClick={() => setShowBcc(true)} className="hover:text-blue-400 px-1 py-0.5 rounded hover:bg-slate-800">
                        Bcc
                      </button>
                    )}
                  </div>
                </div>

                {/* CC Field with Tag Badges */}
                {showCc && (
                  <div
                    onClick={() => document.getElementById('compose-cc-input')?.focus()}
                    className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 py-1 text-xs min-h-[34px] cursor-text"
                  >
                    <span className="text-slate-400 font-semibold w-8 shrink-0 select-none">Cc:</span>

                    {composeData.ccTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full text-xs font-mono animate-fadeIn"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setComposeData((prev) => ({
                              ...prev,
                              ccTags: prev.ccTags.filter((_, i) => i !== idx),
                            }));
                          }}
                          className="text-purple-400 hover:text-white text-xs font-bold leading-none ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    <input
                      id="compose-cc-input"
                      type="text"
                      placeholder={composeData.ccTags.length === 0 ? "cc@example.com (press Enter)..." : "Add more Cc..."}
                      value={composeData.ccInput}
                      onChange={(e) => setComposeData({ ...composeData, ccInput: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab' || e.key === ' ') {
                          if (composeData.ccInput.trim()) {
                            e.preventDefault();
                            e.stopPropagation();
                            const val = composeData.ccInput.replace(/[,;\s]/g, '').trim();
                            if (val && !composeData.ccTags.includes(val)) {
                              setComposeData((prev) => ({
                                ...prev,
                                ccTags: [...prev.ccTags, val],
                                ccInput: '',
                              }));
                            }
                          }
                        } else if (e.key === 'Backspace' && !composeData.ccInput && composeData.ccTags.length > 0) {
                          setComposeData((prev) => ({
                            ...prev,
                            ccTags: prev.ccTags.slice(0, -1),
                          }));
                        }
                      }}
                      onBlur={() => {
                        if (composeData.ccInput.trim()) {
                          const val = composeData.ccInput.replace(/[,;\s]/g, '').trim();
                          if (val && !composeData.ccTags.includes(val)) {
                            setComposeData((prev) => ({
                              ...prev,
                              ccTags: [...prev.ccTags, val],
                              ccInput: '',
                            }));
                          }
                        }
                      }}
                      className="flex-1 min-w-[120px] bg-transparent text-white placeholder-slate-500 focus:outline-none text-xs"
                    />
                    <button type="button" onClick={() => setShowCc(false)} className="text-slate-500 hover:text-white text-xs px-1">✕</button>
                  </div>
                )}

                {/* BCC Field with Tag Badges */}
                {showBcc && (
                  <div
                    onClick={() => document.getElementById('compose-bcc-input')?.focus()}
                    className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 py-1 text-xs min-h-[34px] cursor-text"
                  >
                    <span className="text-slate-400 font-semibold w-8 shrink-0 select-none">Bcc:</span>

                    {composeData.bccTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-xs font-mono animate-fadeIn"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setComposeData((prev) => ({
                              ...prev,
                              bccTags: prev.bccTags.filter((_, i) => i !== idx),
                            }));
                          }}
                          className="text-emerald-400 hover:text-white text-xs font-bold leading-none ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    <input
                      id="compose-bcc-input"
                      type="text"
                      placeholder={composeData.bccTags.length === 0 ? "bcc@example.com (press Enter)..." : "Add more Bcc..."}
                      value={composeData.bccInput}
                      onChange={(e) => setComposeData({ ...composeData, bccInput: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab' || e.key === ' ') {
                          if (composeData.bccInput.trim()) {
                            e.preventDefault();
                            e.stopPropagation();
                            const val = composeData.bccInput.replace(/[,;\s]/g, '').trim();
                            if (val && !composeData.bccTags.includes(val)) {
                              setComposeData((prev) => ({
                                ...prev,
                                bccTags: [...prev.bccTags, val],
                                bccInput: '',
                              }));
                            }
                          }
                        } else if (e.key === 'Backspace' && !composeData.bccInput && composeData.bccTags.length > 0) {
                          setComposeData((prev) => ({
                            ...prev,
                            bccTags: prev.bccTags.slice(0, -1),
                          }));
                        }
                      }}
                      onBlur={() => {
                        if (composeData.bccInput.trim()) {
                          const val = composeData.bccInput.replace(/[,;\s]/g, '').trim();
                          if (val && !composeData.bccTags.includes(val)) {
                            setComposeData((prev) => ({
                              ...prev,
                              bccTags: [...prev.bccTags, val],
                              bccInput: '',
                            }));
                          }
                        }
                      }}
                      className="flex-1 min-w-[120px] bg-transparent text-white placeholder-slate-500 focus:outline-none text-xs"
                    />
                    <button type="button" onClick={() => setShowBcc(false)} className="text-slate-500 hover:text-white text-xs px-1">✕</button>
                  </div>
                )}

                {/* Subject Field */}
                <div className="flex items-center border-b border-slate-800 py-1.5 text-xs">
                  <span className="text-slate-400 font-semibold w-10">Subject:</span>
                  <input
                    type="text"
                    required
                    placeholder="Subject"
                    value={composeData.subject}
                    onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                    className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-xs font-medium"
                  />
                </div>

                {/* Scheduling Date Picker if active */}
                {isScheduling && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs flex items-center justify-between">
                    <span className="text-[11px] text-amber-300 font-medium">Schedule Dispatch:</span>
                    <input
                      type="datetime-local"
                      required={isScheduling}
                      value={composeData.scheduledAt}
                      onChange={(e) => setComposeData({ ...composeData, scheduledAt: e.target.value })}
                      className="bg-slate-800 border border-slate-700 text-xs text-white rounded px-2 py-0.5 focus:outline-none"
                    />
                  </div>
                )}

                {/* Toolbar Header: Template Selector & View Tabs (Visual, Live Preview, HTML) */}
                <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-950/60 rounded-lg border border-slate-800 text-xs flex-wrap">
                  {/* Insert Template Quick Selector */}
                  {emailTemplates.length > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <select
                        onChange={(e) => {
                          const selected = emailTemplates.find((t) => t.id === Number(e.target.value));
                          if (selected) {
                            handleApplyTemplateToCompose(selected);
                          }
                          e.target.value = '';
                        }}
                        defaultValue=""
                        className="bg-slate-800 border border-slate-700 text-[11px] text-indigo-300 rounded px-2 py-0.5 focus:outline-none"
                      >
                        <option value="" disabled>Insert Template...</option>
                        {emailTemplates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">Compose Message</span>
                  )}

                  {/* Mode Switcher Tabs (Visual Editor vs Live Preview vs HTML) */}
                  <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700/80 text-[10px] ml-auto">
                    <button
                      type="button"
                      onClick={() => setComposeEditorView('editor')}
                      className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                        composeEditorView === 'editor' ? 'bg-blue-600 text-white font-medium shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileText className="w-2.5 h-2.5" />
                      <span>Visual</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposeEditorView('preview')}
                      className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                        composeEditorView === 'preview' ? 'bg-blue-600 text-white font-medium shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Eye className="w-2.5 h-2.5" />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposeEditorView('code')}
                      className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                        composeEditorView === 'code' ? 'bg-blue-600 text-white font-medium shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Code className="w-2.5 h-2.5" />
                      <span>HTML</span>
                    </button>
                  </div>
                </div>

                {/* Editor Content Area based on selected Tab */}
                {composeEditorView === 'editor' && (
                  <div className="flex-1 flex flex-col min-h-[220px]">
                    <RichEditor
                      content={composeData.bodyHtml || composeData.bodyText}
                      onChange={(html) => {
                        setComposeData((prev) => ({
                          ...prev,
                          bodyHtml: html,
                          bodyText: html.replace(/<[^>]+>/g, ''),
                        }));
                      }}
                      placeholder="Write your email content..."
                      minHeight="200px"
                    />
                  </div>
                )}

                {/* Live Preview Tab in Compose Modal */}
                {composeEditorView === 'preview' && (
                  <div className="flex-1 border border-slate-700/80 rounded-xl overflow-hidden bg-white text-slate-900 shadow-inner flex flex-col min-h-[220px]">
                    <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-600">
                      <span className="truncate max-w-[280px]">
                        <strong>Subject:</strong> {composeData.subject || '(No Subject)'}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Live Preview</span>
                    </div>
                    <div
                      className="p-4 flex-1 overflow-y-auto text-xs font-sans leading-relaxed prose prose-sm max-w-none text-slate-900"
                      dangerouslySetInnerHTML={{
                        __html:
                          composeData.bodyHtml ||
                          composeData.bodyText ||
                          '<p style="color: #94a3b8; font-style: italic;">No message content written yet. Switch to Visual mode to write your email.</p>',
                      }}
                    />
                  </div>
                )}

                {/* Raw HTML Source Tab in Compose Modal */}
                {composeEditorView === 'code' && (
                  <div className="flex-1 border border-slate-700/80 rounded-xl overflow-hidden bg-slate-950 flex flex-col min-h-[220px]">
                    <div className="bg-slate-900 border-b border-slate-800 px-3 py-1 text-[11px] text-slate-400 font-mono flex items-center justify-between">
                      <span>HTML Source Editor</span>
                      <span className="text-[10px] text-emerald-400">Direct Code Mode</span>
                    </div>
                    <textarea
                      rows={9}
                      value={composeData.bodyHtml}
                      onChange={(e) => {
                        const val = e.target.value;
                        setComposeData((prev) => ({
                          ...prev,
                          bodyHtml: val,
                          bodyText: val.replace(/<[^>]+>/g, ''),
                        }));
                      }}
                      placeholder="<div>Write or paste custom HTML email code...</div>"
                      className="w-full flex-1 bg-slate-950 p-3 text-xs text-emerald-400 placeholder-slate-600 focus:outline-none resize-none font-mono leading-relaxed"
                    />
                  </div>
                )}

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <label className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer flex items-center gap-1 text-xs">
                      <Paperclip className="w-4 h-4" />
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            toast.info(`Attached ${e.target.files.length} file(s)`);
                          }
                        }}
                      />
                    </label>

                    <select
                      value={composeData.priority}
                      onChange={(e) => setComposeData({ ...composeData, priority: e.target.value })}
                      className="bg-slate-800 border border-slate-700 text-[10px] text-slate-300 rounded px-2 py-1"
                    >
                      <option value="normal">Normal Priority</option>
                      <option value="high">⚡ High Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setComposeModal(false)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800"
                      title="Discard"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/30"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isScheduling ? 'Schedule' : 'Send'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===================== MODAL: CREATE CUSTOM FOLDER ===================== */}
      {createFolderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3">Create Custom Folder</h3>
            <form onSubmit={handleCreateFolder} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Folder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Invoices or Projects"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Folder Color</label>
                <div className="flex gap-2">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewFolderColor(c)}
                      className={`w-6 h-6 rounded-full border-2 ${newFolderColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setCreateFolderModal(false)} className="px-3 py-1.5 text-xs text-slate-400">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-xs font-semibold text-white rounded-lg">
                  Save Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CREATE CUSTOM LABEL ===================== */}
      {createLabelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3">Create Custom Label</h3>
            <form onSubmit={handleCreateLabel} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Label Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Urgent or VIP Client"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Label Color</label>
                <div className="flex gap-2">
                  {['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#a855f7'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewLabelColor(c)}
                      className={`w-6 h-6 rounded-full border-2 ${newLabelColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setCreateLabelModal(false)} className="px-3 py-1.5 text-xs text-slate-400">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-xs font-semibold text-white rounded-lg">
                  Save Label
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: SUPER ADMIN PLAN CREATOR ===================== */}
      {planModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              {planFormData.id ? 'Edit Package' : 'Create New Subscription Package'}
            </h3>
            <form onSubmit={handleSavePlan} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Package Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Business"
                  value={planFormData.name}
                  onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Monthly Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={planFormData.price_monthly}
                    onChange={(e) => setPlanFormData({ ...planFormData, price_monthly: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Max Domains</label>
                  <input
                    type="number"
                    required
                    value={planFormData.max_domains}
                    onChange={(e) => setPlanFormData({ ...planFormData, max_domains: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Max Mailbox Users</label>
                  <input
                    type="number"
                    required
                    value={planFormData.max_mailboxes}
                    onChange={(e) => setPlanFormData({ ...planFormData, max_mailboxes: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Storage (MB)</label>
                  <input
                    type="number"
                    required
                    value={planFormData.storage_quota_mb}
                    onChange={(e) => setPlanFormData({ ...planFormData, storage_quota_mb: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setPlanModal(false)} className="px-4 py-2 text-xs text-slate-400">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-purple-600 text-xs font-bold text-white rounded-lg shadow-lg">
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CREATE MAILBOX ===================== */}
      {newMailboxModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4">Create New Professional Mailbox</h3>
            <form onSubmit={handleCreateMailbox} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select Domain</label>
                <select
                  value={newMailboxData.domainId}
                  onChange={(e) => setNewMailboxData({ ...newMailboxData, domainId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  {domains.map((d) => (
                    <option key={d.id} value={d.id}>
                      @{d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Username / Alias</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="foysal or support"
                    value={newMailboxData.username}
                    onChange={(e) => setNewMailboxData({ ...newMailboxData, username: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-l-lg px-3 py-2 text-xs text-white"
                  />
                  <span className="bg-slate-800/80 border border-l-0 border-slate-700 px-3 py-2 text-xs text-slate-400 rounded-r-lg">
                    @{domains.find((d) => d.id.toString() === newMailboxData.domainId)?.name || 'domain.com'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Foysal Ahmed"
                  value={newMailboxData.fullName}
                  onChange={(e) => setNewMailboxData({ ...newMailboxData, fullName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Mailbox Password</label>
                <input
                  type="password"
                  required
                  placeholder="Password for Webmail & IMAP/SMTP"
                  value={newMailboxData.password}
                  onChange={(e) => setNewMailboxData({ ...newMailboxData, password: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              {/* STORAGE QUOTA ALLOCATION (DYNAMICALLY CAPPED TO COMPANY PLAN LIMIT) */}
              {/* ROLE SELECTION */}
              <div>
                <label className="block text-xs font-semibold text-purple-300 mb-1.5">
                  🛡️ Assign User Role & Permissions
                </label>
                <select
                  value={newMailboxData.roleId || ''}
                  onChange={(e) => setNewMailboxData({ ...newMailboxData, roleId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="">Standard User (Default permissions)</option>
                  {companyRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.description || 'Custom role'}
                    </option>
                  ))}
                </select>
              </div>

              {/* STORAGE QUOTA ALLOCATION (TYPABLE INPUT + DYNAMIC PRESETS) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-amber-300">
                    💾 Storage Space Allocation (MB or GB)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Max: {(currentUser?.storage_quota_mb ? currentUser.storage_quota_mb / 1024 : 10).toFixed(0)} GB ({currentUser?.storage_quota_mb || 10240} MB)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="relative">
                    <input
                      type="number"
                      min={100}
                      max={currentUser?.storage_quota_mb || 10240}
                      value={newMailboxData.quotaMb}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const maxCap = currentUser?.storage_quota_mb || 10240;
                        setNewMailboxData({ ...newMailboxData, quotaMb: Math.min(val, maxCap) });
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Type MB (e.g. 2048)"
                    />
                    <span className="absolute right-2.5 top-2 text-[11px] text-slate-400 font-bold">MB</span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300">
                    <span className="font-mono text-emerald-400 font-bold">{(newMailboxData.quotaMb / 1024).toFixed(2)} GB</span>
                    <span className="text-[10px] text-slate-400">allocated</span>
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap gap-1">
                  {[512, 1024, 2048, 5120, 10240]
                    .filter((mb) => mb <= (currentUser?.storage_quota_mb || 10240))
                    .map((mb) => (
                      <button
                        type="button"
                        key={mb}
                        onClick={() => setNewMailboxData({ ...newMailboxData, quotaMb: mb })}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          newMailboxData.quotaMb === mb
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {mb >= 1024 ? `${(mb / 1024).toFixed(0)} GB` : `${mb} MB`}
                      </button>
                    ))}
                </div>
              </div>

              {/* INDIVIDUAL USER SIGNATURE (TEXT OR HTML) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-indigo-300">
                    ✍️ User Individual Signature (Supports HTML / Plaintext)
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono">HTML Enabled &lt;div&gt;, &lt;b&gt;, &lt;img&gt;</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="<div style='font-family: Arial;'><b>Best regards,</b><br/>Foysal Ahmed<br/><span style='color: #2563eb;'>Senior Developer</span></div>"
                  value={newMailboxData.signature}
                  onChange={(e) => setNewMailboxData({ ...newMailboxData, signature: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setNewMailboxModal(false)} className="px-4 py-2 text-xs font-medium text-slate-400">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded-lg">
                  Create Mailbox
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: EDIT MAILBOX (QUOTA & SIGNATURE & ROLE) ===================== */}
      {editMailboxModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white">Edit Mailbox Settings & Signature</h3>
              <button onClick={() => setEditMailboxModal(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>
            <form onSubmit={handleUpdateMailbox} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Mailbox Address</label>
                <input
                  type="text"
                  disabled
                  value={editMailboxModal.email}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editMailboxForm.fullName}
                  onChange={(e) => setEditMailboxForm({ ...editMailboxForm, fullName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              {/* ROLE SELECTION */}
              <div>
                <label className="block text-xs font-semibold text-purple-300 mb-1">
                  🛡️ User Role & Permissions
                </label>
                <select
                  value={editMailboxForm.roleId || ''}
                  onChange={(e) => setEditMailboxForm({ ...editMailboxForm, roleId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="">Standard User (Default permissions)</option>
                  {companyRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.description || 'Custom role'}
                    </option>
                  ))}
                </select>
              </div>

              {/* STORAGE QUOTA ALLOCATION (TYPABLE INPUT + DYNAMIC PRESETS) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-amber-300">
                    💾 Allocated Cloud Storage (Type MB or GB)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Max: {(currentUser?.storage_quota_mb ? currentUser.storage_quota_mb / 1024 : 10).toFixed(0)} GB ({currentUser?.storage_quota_mb || 10240} MB)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="relative">
                    <input
                      type="number"
                      min={100}
                      max={currentUser?.storage_quota_mb || 10240}
                      value={editMailboxForm.quotaMb}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const maxCap = currentUser?.storage_quota_mb || 10240;
                        setEditMailboxForm({ ...editMailboxForm, quotaMb: Math.min(val, maxCap) });
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="absolute right-2.5 top-2 text-[11px] text-slate-400 font-bold">MB</span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300">
                    <span className="font-mono text-emerald-400 font-bold">{(editMailboxForm.quotaMb / 1024).toFixed(2)} GB</span>
                    <span className="text-[10px] text-slate-400">allocated</span>
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap gap-1">
                  {[512, 1024, 2048, 5120, 10240]
                    .filter((mb) => mb <= (currentUser?.storage_quota_mb || 10240))
                    .map((mb) => (
                      <button
                        type="button"
                        key={mb}
                        onClick={() => setEditMailboxForm({ ...editMailboxForm, quotaMb: mb })}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          editMailboxForm.quotaMb === mb
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {mb >= 1024 ? `${(mb / 1024).toFixed(0)} GB` : `${mb} MB`}
                      </button>
                    ))}
                </div>
              </div>

              {/* INDIVIDUAL USER SIGNATURE (TEXT OR HTML) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-indigo-300">
                    ✍️ Individual Email Signature (Supports HTML / Plaintext)
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono">HTML Enabled &lt;div&gt;, &lt;b&gt;, &lt;img&gt;</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="<div style='font-family: Arial;'><b>Best regards,</b><br/>Name | Title<br/>Direct: +880 1700-000000</div>"
                  value={editMailboxForm.signature}
                  onChange={(e) => setEditMailboxForm({ ...editMailboxForm, signature: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">New Password (Leave blank to keep unchanged)</label>
                <input
                  type="password"
                  placeholder="Set new mailbox password"
                  value={editMailboxForm.password}
                  onChange={(e) => setEditMailboxForm({ ...editMailboxForm, password: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setEditMailboxModal(null)} className="px-4 py-2 text-xs font-medium text-slate-400">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded-lg">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: EDIT CUSTOM DOMAIN ===================== */}
      {editDomainModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Edit Custom Domain</h3>
              </div>
              <button onClick={() => setEditDomainModal(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>
            <form onSubmit={handleUpdateDomain} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Domain Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. branddomain.com"
                  value={editDomainName}
                  onChange={(e) => setEditDomainName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Editing domain name will update DNS records generation and DKIM signatures for this tenant domain.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setEditDomainModal(null)} className="px-4 py-2 text-xs text-slate-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded-lg shadow-lg">
                  Update Domain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADVANCED BULK CAMPAIGN WITH GROUPS & TAGS ===================== */}
      {bulkModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Compose Bulk Email Campaign</h3>
              </div>
              <button onClick={() => setBulkModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleLaunchCampaign} className="space-y-3.5 flex-1 overflow-y-auto">
              {/* Select Target Group */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Target Contact Group <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={bulkData.listId}
                    onChange={(e) => setBulkData({ ...bulkData, listId: e.target.value })}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    {contactLists.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.contact_count} contacts)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setCreateGroupModal(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs"
                  >
                    + New Group
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Campaign Title (Internal Reference)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. March 2026 Promotional Newsletter"
                  value={bulkData.title}
                  onChange={(e) => setBulkData({ ...bulkData, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Subject Line</label>
                <input
                  type="text"
                  required
                  placeholder="Hi {{ name }}, we have special updates for {{ company }}!"
                  value={bulkData.subject}
                  onChange={(e) => setBulkData({ ...bulkData, subject: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium"
                />
              </div>

              {/* DYNAMIC TAG INSERTION TOOLBAR (Exactly matching requested UI) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">HTML Email Template</label>
                <div className="bg-slate-950 p-2.5 rounded-t-lg border border-slate-800 border-b-0">
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] text-slate-400 font-medium">Insert Tag:</span>
                    <button
                      type="button"
                      onClick={() => setBulkData({ ...bulkData, bodyHtml: bulkData.bodyHtml + ' {{ name }} ' })}
                      className="px-2 py-0.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-mono text-[10px] font-bold border border-blue-500/30 transition-colors"
                    >
                      + {"{{name}}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkData({ ...bulkData, bodyHtml: bulkData.bodyHtml + ' {{ company }} ' })}
                      className="px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30 transition-colors"
                    >
                      + {"{{company}}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkData({ ...bulkData, bodyHtml: bulkData.bodyHtml + ' {{ email }} ' })}
                      className="px-2 py-0.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-mono text-[10px] font-bold border border-purple-500/30 transition-colors"
                    >
                      + {"{{email}}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkData({ ...bulkData, bodyHtml: bulkData.bodyHtml + ' <a href="{{ unsubscribeUrl }}">Unsubscribe</a> ' })}
                      className="px-2 py-0.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-mono text-[10px] font-bold border border-rose-500/30 transition-colors"
                    >
                      + {"{{unsubscribeUrl}}"}
                    </button>
                  </div>
                </div>

                <textarea
                  required
                  rows={8}
                  placeholder="<p>Dear {{ name }},</p><p>We are delighted to partner with {{ company }}...</p>"
                  value={bulkData.bodyHtml}
                  onChange={(e) => setBulkData({ ...bulkData, bodyHtml: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-b-lg p-3 text-xs text-white font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">
                  Each recipient in the group will receive a customized email via throttled Queue.
                </span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setBulkModal(false)} className="px-4 py-2 text-xs text-slate-400 hover:text-white">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Queue Campaign</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CREATE CONTACT GROUP (BULK RECIPIENTS) ===================== */}
      {createGroupModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-2">Create New Contact Group</h3>
            <p className="text-xs text-slate-400 mb-4">Add a group name and paste contact emails for bulk sending.</p>

            <form onSubmit={handleCreateGroup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Clients (20 Members)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Contacts List (1 per line, format: <code>email, name, company</code>)
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder={`client1@example.com, John Doe, Acme Corp\nclient2@example.com, Sarah Smith, Tech Innovators\nclient3@example.com, Michael, Global Solutions`}
                  value={newGroupCsv}
                  onChange={(e) => setNewGroupCsv(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white font-mono placeholder-slate-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setCreateGroupModal(false)} className="px-4 py-2 text-xs text-slate-400">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded-lg">
                  Save Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CREATE SUB-USER WITH ROLE PERMISSIONS ===================== */}
      {subUserModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Create Sub-User Account</h3>
                <p className="text-xs text-slate-400">Configure credentials and grant specific operational permissions.</p>
              </div>
              <button onClick={() => setSubUserModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateSubUser} className="space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Sub-User Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Staff Operator"
                    value={subUserForm.name}
                    onChange={(e) => setSubUserForm({ ...subUserForm, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Login Email</label>
                  <input
                    type="email"
                    required
                    placeholder="staff@domain.com"
                    value={subUserForm.email}
                    onChange={(e) => setSubUserForm({ ...subUserForm, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Account Password</label>
                <input
                  type="password"
                  required
                  placeholder="Set account password"
                  value={subUserForm.password}
                  onChange={(e) => setSubUserForm({ ...subUserForm, password: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              {/* RBAC Granular Permissions Checkboxes */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wider text-slate-300">
                  Granular Role & Permissions Access
                </h4>
                <div className="space-y-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subUserForm.permissions.canSendBulk}
                      onChange={(e) =>
                        setSubUserForm({
                          ...subUserForm,
                          permissions: { ...subUserForm.permissions, canSendBulk: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-medium text-white block">Bulk Email Campaigns</span>
                      <span className="text-[10px] text-slate-400 block">Can compose and dispatch bulk campaign queues</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subUserForm.permissions.canDeleteMail}
                      onChange={(e) =>
                        setSubUserForm({
                          ...subUserForm,
                          permissions: { ...subUserForm.permissions, canDeleteMail: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-medium text-white block">Delete Emails & Trash</span>
                      <span className="text-[10px] text-slate-400 block">Can move emails to trash and permanently delete</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subUserForm.permissions.canManageFolders}
                      onChange={(e) =>
                        setSubUserForm({
                          ...subUserForm,
                          permissions: { ...subUserForm.permissions, canManageFolders: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-medium text-white block">Create & Manage Folders</span>
                      <span className="text-[10px] text-slate-400 block">Can create, rename, and delete custom mailbox folders</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subUserForm.permissions.canManageTags}
                      onChange={(e) =>
                        setSubUserForm({
                          ...subUserForm,
                          permissions: { ...subUserForm.permissions, canManageTags: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-medium text-white block">Create & Manage Tags/Labels</span>
                      <span className="text-[10px] text-slate-400 block">Can create, color-code, and assign custom labels</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subUserForm.permissions.canManageDomains}
                      onChange={(e) =>
                        setSubUserForm({
                          ...subUserForm,
                          permissions: { ...subUserForm.permissions, canManageDomains: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-medium text-white block">Custom Domains Management</span>
                      <span className="text-[10px] text-slate-400 block">Can add new domains and verify DNS records</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subUserForm.permissions.canManageMailboxes}
                      onChange={(e) =>
                        setSubUserForm({
                          ...subUserForm,
                          permissions: { ...subUserForm.permissions, canManageMailboxes: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-medium text-white block">Mailbox Accounts (Add / Delete)</span>
                      <span className="text-[10px] text-slate-400 block">Can create new professional mailboxes and delete them</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setSubUserModal(false)} className="px-4 py-2 text-xs text-slate-400">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-xs font-semibold text-white rounded-lg shadow-lg">
                  Save Sub-User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: GENERATE API KEY ===================== */}
      {newKeyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Generate Developer API Key</h3>
              </div>
              <button onClick={() => setNewKeyModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateApiKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Key Name / App Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Website / WooCommerce / Next.js App"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sender Mailbox (Optional)</label>
                <select
                  value={newKeySender}
                  onChange={(e) => setNewKeySender(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Any verified mailbox in my account</option>
                  {mailboxes.map((mb) => (
                    <option key={mb.id} value={mb.email}>
                      {mb.email} ({mb.full_name || 'Mailbox'})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  If selected, this API key will send strictly through this specific mailbox address.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewKeyModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-emerald-600/30"
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CREATE / EDIT EMAIL TEMPLATE ===================== */}
      {templateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  {templateFormData.id ? 'Edit Email Template' : 'Create Email Template'}
                </h3>
              </div>
              <button onClick={() => setTemplateModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Template Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Welcome Onboarding or Monthly Invoice"
                    value={templateFormData.name}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={templateFormData.category}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="General">General</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Billing">Billing & Invoices</option>
                    <option value="Marketing">Marketing / Promo</option>
                    <option value="Support">Support & Updates</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Default Subject Line</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Welcome {{name}} to {{company}}!"
                  value={templateFormData.subject}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, subject: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300">Template Design & Content</label>

                  {/* Editor Mode Switcher (Visual Editor vs Live Preview vs HTML Source) */}
                  <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setTemplateEditorView('editor')}
                      className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                        templateEditorView === 'editor' ? 'bg-indigo-600 text-white font-medium shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileText className="w-3 h-3" />
                      <span>Visual Editor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateEditorView('preview')}
                      className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                        templateEditorView === 'preview' ? 'bg-indigo-600 text-white font-medium shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>Live Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateEditorView('code')}
                      className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                        templateEditorView === 'code' ? 'bg-indigo-600 text-white font-medium shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Code className="w-3 h-3" />
                      <span>HTML</span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Tag Inserter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap mb-2 p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-medium">Merge Tags:</span>
                  {['{{name}}', '{{company}}', '{{email}}', '{{unsubscribeUrl}}'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const insertion = ` ${tag} `;
                        setTemplateFormData((prev) => ({
                          ...prev,
                          bodyHtml: prev.bodyHtml + insertion,
                        }));
                        toast.success(`Inserted ${tag}`);
                      }}
                      className="px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-mono text-[11px] border border-indigo-500/30 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>

                {/* Editor Content Area */}
                {templateEditorView === 'editor' && (
                  <div className="flex flex-col min-h-[260px]">
                    <RichEditor
                      content={templateFormData.bodyHtml}
                      onChange={(html) => setTemplateFormData((prev) => ({ ...prev, bodyHtml: html }))}
                      placeholder="Design your template using headings, lists, bold, links, and styling..."
                      minHeight="240px"
                    />
                  </div>
                )}

                {/* Live Preview Mode (Rendered as Real Email Client) */}
                {templateEditorView === 'preview' && (
                  <div className="border border-slate-700 rounded-xl overflow-hidden bg-white text-slate-900 shadow-inner">
                    <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600">
                      <span><strong>Subject Preview:</strong> {templateFormData.subject || '(No Subject)'}</span>
                      <span className="text-[10px] text-slate-400 uppercase">Desktop Email Client View</span>
                    </div>
                    <div
                      className="p-6 max-h-80 overflow-y-auto font-sans leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: templateFormData.bodyHtml || '<p style="color: #94a3b8; font-style: italic;">No email content to preview yet. Switch to Visual Editor to write your email.</p>',
                      }}
                    />
                  </div>
                )}

                {/* HTML Source Code Mode */}
                {templateEditorView === 'code' && (
                  <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-950">
                    <div className="bg-slate-800/80 border-b border-slate-700 px-4 py-1.5 text-xs text-slate-400 font-mono">
                      Raw HTML Template Source
                    </div>
                    <textarea
                      rows={10}
                      required
                      value={templateFormData.bodyHtml}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, bodyHtml: e.target.value })}
                      className="w-full bg-slate-950 p-4 text-xs text-emerald-400 placeholder-slate-500 focus:outline-none resize-none font-mono leading-relaxed"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTemplateModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  {templateFormData.id ? 'Update Template' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: UPGRADE PACKAGE & GENERATE INVOICE ===================== */}
      {upgradeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Upgrade Subscription Plan</h3>
              </div>
              <button onClick={() => setUpgradeModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleRequestUpgrade} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Select Target Plan</label>
                <div className="grid grid-cols-1 gap-2.5">
                  {plans.map((p) => {
                    const isCurrent = currentUser?.plan_id === p.id;
                    const isSelected = selectedUpgradePlan?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => !isCurrent && setSelectedUpgradePlan(p)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-white'
                            : isCurrent
                            ? 'bg-slate-800/40 border-slate-700/60 opacity-60 cursor-not-allowed'
                            : 'bg-slate-800/60 border-slate-700 hover:border-slate-600 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{p.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">Current Plan</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 mt-0.5 block">
                            {p.max_domains} Domains • {p.max_mailboxes} Mailboxes • {p.storage_quota_mb / 1024} GB Storage
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-white">${p.price_monthly}</span>
                          <span className="text-[10px] text-slate-400 block">/month</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
                <select
                  value={upgradePaymentForm.paymentMethod}
                  onChange={(e) => setUpgradePaymentForm({ ...upgradePaymentForm, paymentMethod: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg focus:outline-none"
                >
                  <option value="card">Credit / Debit Card</option>
                  <option value="bank_transfer">Manual Bank Transfer</option>
                  <option value="bkash_nagad">Mobile Banking (bKash / Nagad)</option>
                  <option value="crypto">Cryptocurrency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Transaction ID / Payment Reference</label>
                <input
                  type="text"
                  placeholder="e.g. TRX-90412895 or Card Ref"
                  value={upgradePaymentForm.transactionId}
                  onChange={(e) => setUpgradePaymentForm({ ...upgradePaymentForm, transactionId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white rounded-lg focus:outline-none"
                />
                <p className="text-[11px] text-amber-400/90 mt-1.5 flex items-start gap-1">
                  <span>ℹ️</span>
                  <span>Notice: Upgrading will generate an unpaid pending invoice. Super Admin will verify your payment reference and approve the invoice before your new limits are activated.</span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setUpgradeModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedUpgradePlan || selectedUpgradePlan?.id === currentUser?.plan_id}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-xs font-bold text-white rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Request Upgrade & Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: SUPER ADMIN DIRECT COMPANY PACKAGE UPGRADE ===================== */}
      {companyPlanModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Change Company Package</h3>
                  <p className="text-xs text-slate-400">Target Tenant: <strong className="text-white">{companyPlanModal.name}</strong></p>
                </div>
              </div>
              <button onClick={() => setCompanyPlanModal(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                As Super Admin, selecting a package below will <strong>immediately update</strong> the company&apos;s active plan, domain limits, and mailbox quotas without requiring payment processing:
              </p>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {plans.map((p) => {
                  const isCurrent = companyPlanModal.plan_id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleAdminChangeCompanyPlan(companyPlanModal.id, p.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-slate-800/60 border-slate-700 hover:border-blue-500 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{p.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-semibold">Current Plan</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 mt-0.5 block">
                          {p.max_domains} Domains • {p.max_mailboxes} Mailboxes • {p.storage_quota_mb / 1024} GB Storage
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-white">${p.price_monthly}</span>
                        <span className="text-[10px] text-slate-400 block">/mo</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCompanyPlanModal(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: OFFICIAL PRINTABLE / DOWNLOADABLE INVOICE ===================== */}
      {invoiceViewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            {/* Modal Action Bar */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-bold text-white">Tax Invoice & Payment Receipt</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const printContents = document.getElementById('printable-invoice')?.innerHTML;
                    if (!printContents) {
                      window.print();
                      return;
                    }
                    const printWindow = window.open('', '_blank', 'width=850,height=900');
                    if (printWindow) {
                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <title>Invoice_${invoiceViewModal.invoice_number}</title>
                            <script src="https://cdn.tailwindcss.com"></script>
                            <style>
                              @page { size: A4; margin: 20mm; }
                              body { font-family: system-ui, -apple-system, sans-serif; background: #fff !important; color: #0f172a !important; }
                              table { width: 100%; border-collapse: collapse; }
                              th, td { border: 1px solid #e2e8f0; padding: 10px; }
                              th { background-color: #f8fafc; font-weight: 700; }
                            </style>
                          </head>
                          <body class="p-8">
                            ${printContents}
                            <script>
                              window.onload = function() {
                                window.print();
                              };
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    } else {
                      window.print();
                    }
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceViewModal(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Invoice Body */}
            <div id="printable-invoice" className="p-8 bg-white text-slate-900 font-sans">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-xl font-black text-slate-900">MailBox Pro</span>
                  </div>
                  <p className="text-xs text-slate-500">Enterprise Cloud Email Platform</p>
                  <p className="text-[11px] text-slate-500 mt-1">support@mailserver.local • billing@mailserver.local</p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block mb-1">
                    INVOICE RECEIPT
                  </span>
                  <p className="font-mono font-black text-base text-slate-900">{invoiceViewModal.invoice_number}</p>
                  <p className="text-xs text-slate-500 mt-1">Date: {new Date(invoiceViewModal.created_at).toLocaleDateString()}</p>
                  <div className="mt-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      invoiceViewModal.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : invoiceViewModal.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}>
                      {invoiceViewModal.status === 'approved' ? '✓ PAID & ACTIVATED' : invoiceViewModal.status === 'pending' ? '⏳ PENDING APPROVAL' : '✕ REJECTED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billed To */}
              <div className="grid grid-cols-2 gap-6 my-6 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Billed To (Tenant Organization):</span>
                  <p className="font-bold text-slate-900 text-sm">{invoiceViewModal.company_name || currentUser.company_name || 'Individual Account'}</p>
                  <p className="text-slate-600 mt-0.5">{invoiceViewModal.user_name || currentUser.name}</p>
                  <p className="text-slate-500 font-mono text-[11px]">{invoiceViewModal.user_email || currentUser.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Payment Method & Reference:</span>
                  <p className="font-semibold capitalize text-slate-800">{invoiceViewModal.payment_method || 'Credit Card / Gateway'}</p>
                  {invoiceViewModal.transaction_id && (
                    <p className="text-slate-500 font-mono text-[11px] mt-0.5">Trx ID: {invoiceViewModal.transaction_id}</p>
                  )}
                  {invoiceViewModal.approved_at && (
                    <p className="text-emerald-700 text-[10px] mt-1 font-medium">Approved on {new Date(invoiceViewModal.approved_at).toLocaleString()}</p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs mb-6 border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">Period</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Rate</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-3">
                      <strong className="text-slate-900 block">{invoiceViewModal.plan_name} Subscription</strong>
                      <span className="text-[11px] text-slate-500">
                        Monthly SaaS Mail hosting plan with custom domains and webmail quotas
                      </span>
                    </td>
                    <td className="p-3 text-center capitalize">{invoiceViewModal.billing_cycle || '1 Month'}</td>
                    <td className="p-3 text-center">1</td>
                    <td className="p-3 text-right font-mono">${Number(invoiceViewModal.base_amount || invoiceViewModal.amount).toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      ${Number(invoiceViewModal.base_amount || invoiceViewModal.amount).toFixed(2)}
                    </td>
                  </tr>

                  {/* Overages row if any recorded */}
                  {Number(invoiceViewModal.overage_amount || 0) > 0 && (
                    <tr className="bg-amber-50/50">
                      <td className="p-3">
                        <strong className="text-amber-900 block">Mail Send/Receive Overage Charges</strong>
                        <span className="text-[11px] text-amber-700">
                          Extra Sent: {invoiceViewModal.extra_sent_count || 0} • Extra Received: {invoiceViewModal.extra_received_count || 0}
                        </span>
                      </td>
                      <td className="p-3 text-center">Past Cycle</td>
                      <td className="p-3 text-center">1</td>
                      <td className="p-3 text-right font-mono">${Number(invoiceViewModal.overage_amount).toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-bold text-amber-900">
                        ${Number(invoiceViewModal.overage_amount).toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Total Calculation */}
              <div className="flex justify-end mb-6">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Subscription:</span>
                    <span className="font-mono font-semibold">${Number(invoiceViewModal.base_amount || invoiceViewModal.amount).toFixed(2)}</span>
                  </div>
                  {Number(invoiceViewModal.overage_amount || 0) > 0 && (
                    <div className="flex justify-between text-amber-700 font-medium">
                      <span>Extra Usage Overage:</span>
                      <span className="font-mono">+${Number(invoiceViewModal.overage_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Taxes & Fees (0%):</span>
                    <span className="font-mono">$0.00</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-slate-900 font-bold text-sm">
                    <span>Total Amount:</span>
                    <span className="font-mono text-base font-black text-blue-600">${Number(invoiceViewModal.amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Terms */}
              <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-500 leading-relaxed">
                <p><strong>Payment & Overage Policy:</strong> All standard subscriptions are billed in advance on a monthly recurring basis. Incurred overage charges for emails beyond your quota limits are tallied and appended to the following month&apos;s invoice receipt. Thank you for your business!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: SUPER ADMIN DIRECT CREATE COMPANY ===================== */}
      {createCompanyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Create New SaaS Company (Tenant)</h3>
                  <p className="text-xs text-slate-400">Directly provision organization, company owner account, and plan</p>
                </div>
              </div>
              <button onClick={() => setCreateCompanyModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleSuperAdminCreateCompany} className="space-y-4">
              {/* Organization Info */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-amber-400 block uppercase">1. Organization Details</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Global Ltd"
                      value={newCompanyFormData.companyName}
                      onChange={(e) => setNewCompanyFormData({ ...newCompanyFormData, companyName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Business Email</label>
                    <input
                      type="email"
                      placeholder="contact@apex.com"
                      value={newCompanyFormData.businessEmail}
                      onChange={(e) => setNewCompanyFormData({ ...newCompanyFormData, businessEmail: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 012-3456"
                      value={newCompanyFormData.phone}
                      onChange={(e) => setNewCompanyFormData({ ...newCompanyFormData, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Address</label>
                    <input
                      type="text"
                      placeholder="City, Country"
                      value={newCompanyFormData.address}
                      onChange={(e) => setNewCompanyFormData({ ...newCompanyFormData, address: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Company Admin Account Info */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-blue-400 block uppercase">2. Company Admin Owner Account</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Owner Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={newCompanyFormData.adminName}
                      onChange={(e) => setNewCompanyFormData({ ...newCompanyFormData, adminName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Login Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@apex.com"
                      value={newCompanyFormData.adminEmail}
                      onChange={(e) => setNewCompanyFormData({ ...newCompanyFormData, adminEmail: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={newCompanyFormData.adminPassword}
                    onChange={(e) => setNewCompanyFormData({ ...newCompanyFormData, adminPassword: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Initial Plan Assignment */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Subscription Plan</label>
                <select
                  value={newCompanyFormData.planId || (plans[0]?.id?.toString() || '1')}
                  onChange={(e) => setNewCompanyFormData({ ...newCompanyFormData, planId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white rounded-xl focus:outline-none"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${p.price_monthly}/mo ({p.max_domains} Domains, {p.max_mailboxes} Mailboxes, {p.send_limit || 500} Sends)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Company will be created with status <strong>Active</strong> and an initial approved Tax Invoice will be generated automatically.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateCompanyModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCompanyLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all"
                >
                  {createCompanyLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Create & Activate Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ROLE & PERMISSION MANAGER ===================== */}
      {roleModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Company Roles & Permissions</h3>
                  <p className="text-xs text-slate-400">Define custom roles to assign to your mailboxes</p>
                </div>
              </div>
              <button onClick={() => setRoleModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-1">
              {/* Left Column: Create/Edit Role Form */}
              <form onSubmit={handleSaveRole} className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>{roleForm.id ? '✏️ Edit Role' : '➕ Create New Role'}</span>
                </h4>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Role Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sales Agent or Support Staff"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Access to personal webmail only"
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white rounded-lg focus:outline-none"
                  />
                </div>

                {/* Granular Permission Toggles */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <span className="block text-[11px] font-bold text-slate-300">Allowed Capabilities & Permissions:</span>

                  {/* 1. MAILBOX SWITCHING */}
                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.canSwitchMailbox}
                        onChange={(e) => setRoleForm({
                          ...roleForm,
                          permissions: { ...roleForm.permissions, canSwitchMailbox: e.target.checked },
                        })}
                        className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold block text-amber-300">Switch & View Other Mailboxes</span>
                        <span className="text-[10px] text-slate-400 block">Allow switching to other company email accounts from sidebar footer</span>
                      </div>
                    </label>
                  </div>

                  {/* 2. EMAIL TEMPLATES (GRANULAR: CREATE, EDIT, DELETE) */}
                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-bold text-indigo-300 block">📑 Email Templates Rights:</span>
                    <div className="grid grid-cols-3 gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roleForm.permissions.canCreateTemplates}
                          onChange={(e) => setRoleForm({
                            ...roleForm,
                            permissions: { ...roleForm.permissions, canCreateTemplates: e.target.checked },
                          })}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                        />
                        <span className="text-[11px]">Create</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roleForm.permissions.canEditTemplates}
                          onChange={(e) => setRoleForm({
                            ...roleForm,
                            permissions: { ...roleForm.permissions, canEditTemplates: e.target.checked },
                          })}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                        />
                        <span className="text-[11px]">Edit</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roleForm.permissions.canDeleteTemplates}
                          onChange={(e) => setRoleForm({
                            ...roleForm,
                            permissions: { ...roleForm.permissions, canDeleteTemplates: e.target.checked },
                          })}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                        />
                        <span className="text-[11px]">Delete</span>
                      </label>
                    </div>
                  </div>

                  {/* 3. CUSTOM DOMAINS (GRANULAR: ADD, EDIT, DELETE) */}
                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-bold text-blue-300 block">🌐 Custom Domains Rights:</span>
                    <div className="grid grid-cols-3 gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roleForm.permissions.canAddDomains}
                          onChange={(e) => setRoleForm({
                            ...roleForm,
                            permissions: { ...roleForm.permissions, canAddDomains: e.target.checked },
                          })}
                          className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                        />
                        <span className="text-[11px]">Add Domain</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roleForm.permissions.canEditDomains}
                          onChange={(e) => setRoleForm({
                            ...roleForm,
                            permissions: { ...roleForm.permissions, canEditDomains: e.target.checked },
                          })}
                          className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                        />
                        <span className="text-[11px]">Edit</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roleForm.permissions.canDeleteDomains}
                          onChange={(e) => setRoleForm({
                            ...roleForm,
                            permissions: { ...roleForm.permissions, canDeleteDomains: e.target.checked },
                          })}
                          className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                        />
                        <span className="text-[11px]">Delete</span>
                      </label>
                    </div>
                  </div>

                  {/* 4. MAILBOXES (USERS) (GRANULAR: CREATE, EDIT, DELETE) */}
                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-300 block">👥 Mailboxes Provisioning:</span>
                    <div className="grid grid-cols-3 gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roleForm.permissions.canCreateMailboxes}
                          onChange={(e) => setRoleForm({
                            ...roleForm,
                            permissions: { ...roleForm.permissions, canCreateMailboxes: e.target.checked },
                          })}
                          className="rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-0 w-3.5 h-3.5"
                        />
                        <span className="text-[11px]">Create</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roleForm.permissions.canEditMailboxes}
                          onChange={(e) => setRoleForm({
                            ...roleForm,
                            permissions: { ...roleForm.permissions, canEditMailboxes: e.target.checked },
                          })}
                          className="rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-0 w-3.5 h-3.5"
                        />
                        <span className="text-[11px]">Edit / Space</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roleForm.permissions.canDeleteMailboxes}
                          onChange={(e) => setRoleForm({
                            ...roleForm,
                            permissions: { ...roleForm.permissions, canDeleteMailboxes: e.target.checked },
                          })}
                          className="rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-0 w-3.5 h-3.5"
                        />
                        <span className="text-[11px]">Delete</span>
                      </label>
                    </div>
                  </div>

                  {/* 5. REST API & OTHER PERMISSIONS */}
                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.canAccessRestApi}
                        onChange={(e) => setRoleForm({
                          ...roleForm,
                          permissions: { ...roleForm.permissions, canAccessRestApi: e.target.checked },
                        })}
                        className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold block text-emerald-400">REST API Key Access (v1)</span>
                        <span className="text-[10px] text-slate-400 block">Generate API keys to send emails from external websites/code</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.canSendBulk}
                        onChange={(e) => setRoleForm({
                          ...roleForm,
                          permissions: { ...roleForm.permissions, canSendBulk: e.target.checked },
                        })}
                        className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold block text-slate-200">Bulk Campaigns</span>
                        <span className="text-[10px] text-slate-400 block">Send bulk marketing newsletters</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.canDeleteMail}
                        onChange={(e) => setRoleForm({
                          ...roleForm,
                          permissions: { ...roleForm.permissions, canDeleteMail: e.target.checked },
                        })}
                        className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-0 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold block text-slate-200">Delete Messages</span>
                        <span className="text-[10px] text-slate-400 block">Move messages to trash or delete</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.canManageFolders}
                        onChange={(e) => setRoleForm({
                          ...roleForm,
                          permissions: { ...roleForm.permissions, canManageFolders: e.target.checked },
                        })}
                        className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold block text-slate-200">Custom Folders & Labels</span>
                        <span className="text-[10px] text-slate-400 block">Create custom webmail folders</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  {roleForm.id && (
                    <button
                      type="button"
                      onClick={() => setRoleForm({
                        id: null,
                        name: '',
                        description: '',
                        permissions: {
                          canSwitchMailbox: false,
                          canSendBulk: false,
                          canDeleteMail: true,
                          canManageFolders: true,
                          canAddDomains: false,
                          canEditDomains: false,
                          canDeleteDomains: false,
                          canCreateTemplates: false,
                          canEditTemplates: false,
                          canDeleteTemplates: false,
                          canAccessRestApi: false,
                          canCreateMailboxes: false,
                          canEditMailboxes: false,
                          canDeleteMailboxes: false,
                        },
                      })}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Reset / New
                    </button>
                  )}
                  <button
                    type="submit"
                    className="ml-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-lg"
                  >
                    {roleForm.id ? 'Update Role' : 'Save Role'}
                  </button>
                </div>
              </form>

              {/* Right Column: Existing Roles List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Configured Roles ({companyRoles.length})
                </h4>

                {companyRoles.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 border border-slate-800 rounded-xl">
                    No custom roles created yet. Default permissions will apply to mailboxes.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {companyRoles.map((r) => (
                      <div
                        key={r.id}
                        className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl flex items-start justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{r.name}</span>
                            <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20">
                              {r.user_count || 0} user(s)
                            </span>
                          </div>
                          {r.description && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{r.description}</p>
                          )}

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {r.permissions?.canSwitchMailbox && (
                              <span className="text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                🔄 Switch Mailbox
                              </span>
                            )}
                            {r.permissions?.canSendBulk && (
                              <span className="text-[9px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.5 rounded">
                                ⚡ Bulk
                              </span>
                            )}
                            {r.permissions?.canManageTemplates && (
                              <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                                📑 Templates
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setRoleForm({
                              id: r.id,
                              name: r.name,
                              description: r.description || '',
                              permissions: {
                                canSwitchMailbox: r.permissions?.canSwitchMailbox || false,
                                canSendBulk: r.permissions?.canSendBulk || false,
                                canDeleteMail: r.permissions?.canDeleteMail ?? true,
                                canManageFolders: r.permissions?.canManageFolders ?? true,
                                canAddDomains: r.permissions?.canAddDomains || false,
                                canEditDomains: r.permissions?.canEditDomains || false,
                                canDeleteDomains: r.permissions?.canDeleteDomains || false,
                                canCreateTemplates: r.permissions?.canCreateTemplates || false,
                                canEditTemplates: r.permissions?.canEditTemplates || false,
                                canDeleteTemplates: r.permissions?.canDeleteTemplates || false,
                                canAccessRestApi: r.permissions?.canAccessRestApi || false,
                                canCreateMailboxes: r.permissions?.canCreateMailboxes || false,
                                canEditMailboxes: r.permissions?.canEditMailboxes || false,
                                canDeleteMailboxes: r.permissions?.canDeleteMailboxes || false,
                              },
                            })}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                            title="Edit Role"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(r.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                            title="Delete Role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gmail / cPanel Style Message Original Headers Modal */}
      {messageHeadersModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Email Header Information</h3>
                  <p className="text-xs text-slate-400">Technical routing, SPF, DKIM, and authentication data (Show Original)</p>
                </div>
              </div>
              <button
                onClick={() => setMessageHeadersModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
              <div><strong className="text-slate-400 font-sans">Subject:</strong> <span className="text-slate-200">{messageHeadersModal.subject}</span></div>
              <div><strong className="text-slate-400 font-sans">From:</strong> <span className="text-slate-200">{messageHeadersModal.sender}</span></div>
              <div><strong className="text-slate-400 font-sans">To:</strong> <span className="text-slate-200">{messageHeadersModal.recipients}</span></div>
              <div><strong className="text-slate-400 font-sans">Date:</strong> <span className="text-slate-200">{new Date(messageHeadersModal.created_at).toUTCString()}</span></div>
              <div><strong className="text-slate-400 font-sans">Size:</strong> <span className="text-slate-200">{messageHeadersModal.size_kb || 1} KB</span></div>
              <div><strong className="text-slate-400 font-sans">Security:</strong> <span className="text-emerald-400">TLS Encrypted Delivery</span></div>
            </div>

            {/* Raw Headers Textarea */}
            <div className="flex-1 flex flex-col min-h-[220px]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300">Raw RFC 822 Email Headers:</span>
                <button
                  onClick={() => {
                    const headersToCopy = messageHeadersModal.headers_raw || `From: ${messageHeadersModal.sender}\nTo: ${messageHeadersModal.recipients}\nSubject: ${messageHeadersModal.subject}\nDate: ${new Date(messageHeadersModal.created_at).toUTCString()}`;
                    navigator.clipboard.writeText(headersToCopy);
                    toast.success('Raw email headers copied to clipboard!');
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 flex items-center gap-1 font-sans"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Headers</span>
                </button>
              </div>
              <textarea
                readOnly
                value={
                  messageHeadersModal.headers_raw ||
                  `Received: from mail.kidukart.com (localhost [127.0.0.1]) by mail.kidukart.com with ESMTPS\nFrom: ${messageHeadersModal.sender_name ? `"${messageHeadersModal.sender_name}" <${messageHeadersModal.sender}>` : messageHeadersModal.sender}\nTo: ${messageHeadersModal.recipients}\nSubject: ${messageHeadersModal.subject}\nDate: ${new Date(messageHeadersModal.created_at).toUTCString()}\nContent-Type: text/html; charset="UTF-8"\nStatus: Delivered\nX-MailBox-Engine: MailBox Pro Cloud VPS MTA`
                }
                className="w-full flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs font-mono text-slate-300 select-all focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setMessageHeadersModal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
