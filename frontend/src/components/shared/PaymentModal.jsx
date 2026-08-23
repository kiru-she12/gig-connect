import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CreditCard, PencilSimple, SealCheck, Receipt, X, User
} from '@phosphor-icons/react';

/**
 * Modern Centered Payment Modal for GigConnect
 * Matches the requested specifications:
 * - Replaces password with cardholder Name
 * - Removes Mastercard logo
 * - Replaces "Product" with "Job" in receipt
 * - Removes the floating card mockup from the right column
 * - Perfectly centered in a 100% viewport backdrop
 */
export default function PaymentModal({
  isOpen,
  onClose,
  job,
  clientName = 'Client',
  onPaymentSuccess
}) {
  if (!isOpen || !job) return null;

  // Amount & Boosting Calculations
  const isBoosted = Boolean(job.isBoosted || job.is_boosted == 1 || job.boostFee > 0);
  const basePay = parseFloat(job.pay || job.basePay || 0);
  const commission = basePay * 0.05;
  const boostFee = isBoosted ? 300 : 0;
  const totalAmount = commission + boostFee;

  // Form State
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState(clientName || '');
  const [activeExpiryField, setActiveExpiryField] = useState('year'); // 'month' | 'year'
  const [loading, setLoading] = useState(false);

  // Countdown timer: Initialized to 10 minutes (120 seconds)
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const minStr = String(minutes).padStart(2, '0');
  const secStr = String(seconds).padStart(2, '0');

  // Format Card Number into 4 chunks (XXXX - XXXX - XXXX - XXXX)
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const chunks = raw.match(/.{1,4}/g) || [];
    setCardNumber(chunks.join(' - '));
  };

  const cleanCard = cardNumber.replace(/\D/g, '');

  // Luhn check for card validity
  const isCardComplete = cleanCard.length === 16;
  const isCardValid = (() => {
    if (!isCardComplete) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = cleanCard.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanCard.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  })();

  // Autofill demo credentials
  const fillDemoData = () => {
    setCardNumber('4242 - 4242 - 4242 - 4242');
    setExpMonth('09');
    setExpYear('28');
    setCvv('327');
    setCardholderName(clientName || 'Keerthanan');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cleanCard.length !== 16) {
      alert("Invalid Card Number: Must be exactly 16 digits.");
      return;
    }

    if (!isCardValid) {
      alert("Invalid Card Details");
      return;
    }

    const m = parseInt(expMonth, 10);
    const y = parseInt(expYear.length === 2 ? '20' + expYear : expYear, 10);
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;

    if (!m || m < 1 || m > 12) {
      alert("Invalid card details");
      return;
    }

    if (!y || y < curYear || (y === curYear && m < curMonth)) {
      alert("Invalid card details");
      return;
    }

    const cleanCvv = cvv.replace(/\D/g, '');
    if (cleanCvv.length < 3 || cleanCvv.length > 4) {
      alert("Invalid card details");
      return;
    }

    if (!cardholderName.trim()) {
      alert("Please enter the Cardholder Name.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formattedExpiry = `${String(m).padStart(2, '0')} / ${String(y).slice(-2)}`;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost/gigconnect/backend'}/api/jobs/update_payment_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_ID: job.id,
          payment_status: 'paid',
          card_number: cleanCard,
          expiry_date: formattedExpiry,
          cvv: cleanCvv,
          cardholder_name: cardholderName.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process payment');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      alert("Payment successful! The contract is active and job status is updated to in progress.");
      if (onPaymentSuccess) {
        await onPaymentSuccess();
      }
      onClose();
    } catch (err) {
      alert("Payment failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn font-sans">
      {/* 100% Viewport Backdrop */}
      <div
        className="fixed inset-0 w-full h-full bg-slate-900/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Main Centered Card Container */}
      <div className="relative bg-white rounded-[2rem] max-w-4xl w-full shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col z-10 m-auto max-h-[92vh]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-30 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all font-bold text-xs shadow-sm"
          title="Close modal"
        >
          <X size={16} />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          {/* LEFT COLUMN: Payment Form Controls (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Header: Brand & Countdown Timer */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-600/25 border border-teal-500/30">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <span className="text-xl font-black text-slate-900 tracking-tight font-heading">
                      GigConnect
                    </span>
                  </div>
                </div>

                {/* Digit-by-digit Countdown Timer */}
                <div className="flex items-center gap-1 font-mono font-bold text-sm select-none pr-8">
                  <span className="w-6 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center shadow-inner">
                    {minStr[0]}
                  </span>
                  <span className="w-6 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center shadow-inner">
                    {minStr[1]}
                  </span>
                  <span className="text-slate-800 font-black px-0.5">:</span>
                  <span className="w-6 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center shadow-inner">
                    {secStr[0]}
                  </span>
                  <span className="w-6 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center shadow-inner">
                    {secStr[1]}
                  </span>
                </div>
              </div>

              {/* Form Inputs */}
              <form id="gigconnect-pay-form" onSubmit={handleSubmit} className="mt-6 space-y-5">
                {/* 1. Card Number Row (Mastercard logo removed) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <label className="block text-sm font-bold text-slate-900">Card Number</label>
                      <p className="text-xs text-slate-400">Enter the 16-digit card number on the card</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('card-input-field');
                        if (input) input.focus();
                      }}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
                    >
                      <PencilSimple size={12} />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="relative flex items-center bg-slate-50 border border-slate-200 focus-within:border-teal-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/20 rounded-xl px-3.5 py-3 transition-all">
                    <CreditCard size={18} className="text-slate-400 mr-2.5 shrink-0" />

                    <input
                      id="card-input-field"
                      type="text"
                      required
                      placeholder="2412 - 7512 - 3412 - 3456"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full bg-transparent border-none outline-none font-medium text-slate-800 text-sm placeholder:text-slate-300 tracking-wide"
                    />

                    {/* Verified Theme Badge on Right */}
                    {isCardValid && (
                      <div className="shrink-0 text-emerald-600 animate-fadeIn ml-2">
                        <SealCheck size={20} weight="fill" className="text-emerald-600" />
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. CVV Number Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div>
                    <label className="block text-sm font-bold text-slate-900">CVV Number</label>
                    <p className="text-xs text-slate-400">Enter the 3 or 4 digit number on the card</p>
                  </div>
                  <div className="sm:w-48 relative flex items-center justify-between bg-slate-50 border border-slate-200 focus-within:border-teal-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/20 rounded-xl px-4 py-2.5 transition-all">
                    <input
                      type="password"
                      required
                      maxLength={4}
                      placeholder="327"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center bg-transparent border-none outline-none font-bold text-slate-800 text-sm placeholder:text-slate-300"
                    />
                    {/* 3x3 Keypad Icon */}
                    <div className="grid grid-cols-3 gap-0.5 text-slate-400 ml-2 shrink-0 select-none">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-slate-400"></div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Expiry Date Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div>
                    <label className="block text-sm font-bold text-slate-900">Expiry Date</label>
                    <p className="text-xs text-slate-400">Enter the expiration date of the card</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      maxLength={2}
                      placeholder="09"
                      value={expMonth}
                      onFocus={() => setActiveExpiryField('month')}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setExpMonth(val);
                        if (val.length === 2) {
                          const yrField = document.getElementById('exp-year-input');
                          if (yrField) yrField.focus();
                        }
                      }}
                      className={`w-16 text-center font-bold text-sm py-2.5 bg-slate-50 rounded-xl border transition-all outline-none ${activeExpiryField === 'month'
                        ? 'border-teal-600 bg-white ring-2 ring-teal-500/20 text-slate-900'
                        : 'border-slate-200 text-slate-800'
                        }`}
                    />
                    <span className="text-slate-400 font-bold text-base select-none">/</span>
                    <input
                      id="exp-year-input"
                      type="text"
                      required
                      maxLength={2}
                      placeholder="28"
                      value={expYear}
                      onFocus={() => setActiveExpiryField('year')}
                      onChange={(e) => setExpYear(e.target.value.replace(/\D/g, ''))}
                      className={`w-16 text-center font-bold text-sm py-2.5 bg-slate-50 rounded-xl border transition-all outline-none ${activeExpiryField === 'year'
                        ? 'border-teal-600 bg-white ring-2 ring-teal-500/20 text-slate-900'
                        : 'border-slate-200 text-slate-800'
                        }`}
                    />
                  </div>
                </div>

                {/* 4. Cardholder Name Row (Replaces Password) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div>
                    <label className="block text-sm font-bold text-slate-900">Name</label>
                    <p className="text-xs text-slate-400">Enter the name written on the card</p>
                  </div>
                  <div className="sm:w-56 relative flex items-center bg-slate-50 border border-slate-200 focus-within:border-teal-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/20 rounded-xl px-3.5 py-2.5 transition-all">
                    <User size={15} className="text-slate-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Keerthanan"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      className="w-full bg-transparent border-none outline-none font-semibold text-slate-800 text-sm placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {/* Demo Card Quick Fill Helper */}
                <div
                  onClick={fillDemoData}
                  className="p-2.5 rounded-xl bg-teal-50/70 hover:bg-teal-100/60 border border-teal-100/80 flex items-center justify-between text-xs text-teal-800 cursor-pointer transition-colors"
                  title="Click to autofill test credentials"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    💡 <strong>Test Card:</strong> 4242 4242 4242 4242
                  </span>
                  <span className="text-[11px] font-bold text-teal-700 underline">
                    Auto-Fill Test Info
                  </span>
                </div>
              </form>
            </div>

            {/* Pay Now Button */}
            <div className="pt-2">
              <button
                type="submit"
                form="gigconnect-pay-form"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 active:scale-[0.99] text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-600/25 border border-teal-500/30 transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing Payment...
                  </span>
                ) : (
                  <span>Pay Now</span>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary & Receipt (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 via-slate-100/50 to-teal-50/30 p-6 sm:p-7 border-t lg:border-t-0 lg:border-l border-slate-200/80 flex flex-col justify-between relative overflow-hidden">
            <div>
              {/* Receipt Header */}
              <div className="pb-4 border-b border-slate-200/70 mb-5">
                <h4 className="font-bold text-base text-slate-900 font-heading">Payment Summary</h4>
                <p className="text-xs text-slate-400 mt-0.5">Review your order details before paying</p>
              </div>

              {/* RECEIPT / ORDER DETAILS */}
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Company</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-teal-600 inline-block"></span>
                    GigConnect
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Order Number</span>
                  <span className="font-mono font-semibold text-slate-700">#JOB-{job.id}</span>
                </div>

                {/* Changed "Product" to "Job" */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Job</span>
                  <span className="font-bold text-slate-800 truncate max-w-[170px] text-right" title={job.title}>
                    {job.title}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Platform Commission (5%)</span>
                  <span className="font-bold text-slate-800">
                    LKR {commission.toFixed(2)}
                  </span>
                </div>

                {/* ⚡ JOB BOOST FEE (DYNAMICALLY INCLUDED WHEN BOOSTED) */}
                {isBoosted && (
                  <div className="flex justify-between items-center bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-200/80 text-amber-900 font-semibold animate-fadeIn">
                    <span className="flex items-center gap-1 text-amber-700 font-bold">
                      ⚡ Job Boost Fee
                    </span>
                    <span className="font-black text-amber-800">
                      + LKR 300.00
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[11px] text-slate-400 italic pt-1 border-t border-slate-200/50">
                  <span>Student Payout (upon completion)</span>
                  <span>LKR {basePay.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              {/* RECEIPT NOTCH / PERFORATED CUTOUT DIVIDER */}
              <div className="relative my-5">
                <div className="border-t border-dashed border-slate-300 w-full"></div>
                {/* Left cutout circle */}
                <div className="absolute -left-9 -top-3 w-6 h-6 rounded-full bg-white border-r border-slate-200/80"></div>
                {/* Right cutout circle */}
                <div className="absolute -right-9 -top-3 w-6 h-6 rounded-full bg-white border-l border-slate-200/80"></div>
              </div>

              {/* TOTAL SECTION */}
              <div className="flex items-end justify-between z-10 pb-1">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    You have to Pay
                  </p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 font-heading tracking-tight">
                      {totalAmount.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      LKR
                    </span>
                  </div>
                </div>

                {/* Folded Receipt Paper Icon */}
                <div className="w-10 h-10 rounded-xl bg-slate-200/70 flex items-center justify-center text-slate-600 shadow-inner">
                  <Receipt size={22} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
