'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PhoneVerification from '@/components/quick-order/PhoneVerification';
import DeliveryForm, { DeliveryFormData } from '@/components/quick-order/DeliveryForm';
import OrderProgress from '@/components/quick-order/OrderProgress';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

type Step = 'phone' | 'delivery' | 'complete';

export default function QuickOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [districtId, setDistrictId] = useState<number | null>(null);

  const handlePhoneSubmit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Normalize phone
      let phoneNumber = phone.trim();
      if (!phoneNumber.startsWith('+255')) {
        phoneNumber = '+255' + phoneNumber.replace(/^\+?255?/, '').replace(/\D/g, '');
      } else {
        phoneNumber = '+255' + phoneNumber.replace(/^\+255/, '').replace(/\D/g, '');
      }

      // Check if phone exists
      const checkResponse = await fetch('/api/deliveries/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const checkData = await checkResponse.json();

      if (!checkResponse.ok) {
        throw new Error(checkData.error || 'Failed to check phone');
      }

      setIsNewUser(!checkData.exists);
      if (checkData.exists && checkData.businessId) {
        setBusinessId(checkData.businessId);
        setUserId(checkData.userId);
      }

      // Send OTP
      const otpResponse = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const otpData = await otpResponse.json();

      if (!otpResponse.ok) {
        throw new Error(otpData.error || 'Failed to send OTP');
      }

      setPhone(phoneNumber);
      setOtpSent(true);
      setSuccess('Verification code sent! Please check your phone.');
      
      // Show debug OTP in development
      if (otpData.debugOtp) {
        setSuccess(`Verification code sent! (Dev mode - Code: ${otpData.debugOtp})`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (code: string) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/quick-verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          code,
          businessName: isNewUser ? businessName : undefined,
          districtId: isNewUser ? districtId : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      // Set session tokens
      if (data.accessToken && data.refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.accessToken,
          refresh_token: data.refreshToken,
        });

        if (sessionError) {
          throw new Error('Failed to create session');
        }
      }

      setUserId(data.userId);
      setBusinessId(data.businessId);
      setStep('delivery');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverySubmit = async (formData: DeliveryFormData) => {
    if (!businessId || !userId) {
      setError('Missing user information. Please start over.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/deliveries/quick-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          userId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create delivery');
      }

      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create delivery');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStep = () => {
    if (step === 'phone') return 1;
    if (step === 'delivery') return 2;
    return 3;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary">Kasi Courier</span>
            </Link>
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Quick Order Delivery
          </h1>
          <p className="text-gray-600 mb-8">
            Order a delivery quickly. We'll verify your phone and create your account if needed.
          </p>

          <OrderProgress currentStep={getCurrentStep()} />

          {step === 'phone' && (
            <div>
              {isNewUser && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 mb-4">
                    This phone number is not registered. We'll create your business account after verification.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={otpSent}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        District (Optional)
                      </label>
                      <input
                        type="number"
                        value={districtId || ''}
                        onChange={(e) => setDistrictId(e.target.value ? Number(e.target.value) : null)}
                        placeholder="District ID"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={otpSent}
                      />
                    </div>
                  </div>
                </div>
              )}

              <PhoneVerification
                phone={phone}
                setPhone={setPhone}
                onPhoneSubmit={handlePhoneSubmit}
                onOTPVerify={handleOTPVerify}
                loading={loading}
                otpSent={otpSent}
                otpCode={otpCode}
                setOtpCode={setOtpCode}
                error={error}
                success={success}
              />
            </div>
          )}

          {step === 'delivery' && (
            <DeliveryForm
              onSubmit={handleDeliverySubmit}
              loading={loading}
              error={error}
            />
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Delivery Created Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                Your delivery request has been submitted. Our team will process it shortly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/dashboard/business/deliveries"
                  className="bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
                >
                  View My Deliveries
                </Link>
                <Link
                  href="/"
                  className="bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
