import React, { useState } from 'react';
import { AlertCircle, Mail, FileText, CheckCircle } from 'lucide-react';

const COMPLAINT_TEMPLATES = [
  {
    id: 'payment',
    label: 'Payment Issue (Delay / Incorrect Amount)',
    subject: '[GigConnect Complaint] Payment Dispute',
    body: `Dear GigConnect Support Team,

I am writing to report a payment issue on the platform.

Job/Gig Details:
- Job ID / Title: [Enter Job ID or Title]
- Partner Name: [Enter Client or Student Name]
- Payment Amount: LKR [Enter Amount]

Description of the issue:
[Please detail the payment delay, missing payment, or incorrect amount here]

Thank you,
[Your Name]
[Your Phone Number]`
  },
  {
    id: 'conduct',
    label: 'User Conduct / Misbehavior',
    subject: '[GigConnect Complaint] User Misbehavior',
    body: `Dear GigConnect Support Team,

I want to report inappropriate behavior or misconduct by another user on the platform.

Incident Details:
- Other User's Name: [Enter Name]
- Job Title (if applicable): [Enter Job Title]
- Date/Time: [Enter Date/Time]

Description of the incident:
[Please describe what happened in detail. GigConnect maintains a strict professional environment and will investigate this promptly.]

Thank you,
[Your Name]
[Your Phone Number]`
  },
  {
    id: 'delivery',
    label: 'Delivery Delays / Issues',
    subject: '[GigConnect Complaint] Delivery Task Issue',
    body: `Dear GigConnect Support Team,

I need assistance regarding a delivery task.

Delivery Details:
- Job/Delivery ID: [Enter ID]
- Scheduled Delivery Time: [Enter Time]
- Delivery Rider Name (if known): [Enter Name]

Description of the problem:
[Explain the delay, damaged goods, address issue, or other delivery problems here]

Thank you,
[Your Name]
[Your Phone Number]`
  },
  {
    id: 'quality',
    label: 'Job Quality / Incomplete Work',
    subject: '[GigConnect Complaint] Work Quality Dispute',
    body: `Dear GigConnect Support Team,

I am reporting a dispute regarding the quality or completeness of a finished job.

Job Details:
- Job ID / Title: [Enter Job Title]
- Student Name / Hired Person: [Enter Name]

Description of the issue:
[Describe the tasks that were not finished, poor quality outputs, or deviation from agreed terms]

Thank you,
[Your Name]
[Your Phone Number]`
  },
  {
    id: 'bug',
    label: 'Technical Bug / Platform Error',
    subject: '[GigConnect Complaint] Technical Issue Report',
    body: `Dear GigConnect Support Team,

I encountered a technical glitch or bug on the GigConnect web application.

Details:
- Screen/Page: [e.g. Job Posting, Applying, Login]
- Device & Browser: [e.g. Chrome on Windows, Safari on Mobile]

Description of the bug:
[Describe what you clicked, what happened, and what you expected to happen]

Thank you,
[Your Name]
[Your Phone Number]`
  },
  {
    id: 'other',
    label: 'Other Issues / Custom Inquiry',
    subject: '[GigConnect Support] General Support Inquiry',
    body: `Dear GigConnect Support Team,

I have a query/complaint that is not listed in the categories.

My Inquiry:
[Please write your custom message or complaint here]

Thank you,
[Your Name]
[Your Phone Number]`
  }
];

const ComplaintsTab = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(COMPLAINT_TEMPLATES[0]);
  const [subject, setSubject] = useState(COMPLAINT_TEMPLATES[0].subject);
  const [body, setBody] = useState(COMPLAINT_TEMPLATES[0].body);
  const [sent, setSent] = useState(false);

  const handleTemplateChange = (templateId) => {
    const template = COMPLAINT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setSubject(template.subject);
      setBody(template.body);
      setSent(false);
    }
  };

  const handleSendEmail = (e) => {
    e.preventDefault();
    const mailtoUrl = `mailto:gigconnect@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
    setSent(true);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Report / Complain</h1>
        <p className="text-text-secondary mt-1">
          Have an issue with a job, payment, or user? Select a template and report it directly to GigConnect support.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Select Template */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-text-primary">1. Select Category</h3>
          <div className="flex flex-col gap-2">
            {COMPLAINT_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => handleTemplateChange(tmpl.id)}
                className={`w-full text-left p-4 rounded-xl border font-bold transition-all flex items-start gap-3 ${
                  selectedTemplate.id === tmpl.id
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                    : 'bg-white border-border text-text-secondary hover:border-primary'
                }`}
              >
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <span className="text-sm">{tmpl.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Columns: Write / Send */}
        <div className="lg:col-span-2">
          <div className="card p-6 md:p-8 space-y-6">
            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
              <FileText size={20} className="text-primary" /> 2. Complete Report Details
            </h3>

            {sent && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-sm font-semibold flex items-center gap-2 animate-fadeIn">
                <CheckCircle size={18} />
                <span>Redirecting to your mail application to send email to gigconnect@gmail.com!</span>
              </div>
            )}

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
                  Support Email
                </label>
                <input
                  type="text"
                  disabled
                  value="gigconnect@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-lg p-2.5 outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-border rounded-lg p-2.5 outline-none focus:border-primary text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
                  Message Body
                </label>
                <textarea
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full border border-border rounded-lg p-2.5 outline-none focus:border-primary text-sm font-medium h-72 resize-none leading-relaxed"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-black text-white p-3.5 rounded-lg font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm"
              >
                <Mail size={18} /> Open Email & Send Report
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintsTab;
