import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import LanguageToggle from '@/components/LanguageToggle';

export default function Login() {
  const [step, setStep] = useState<'phone' | 'otp' | 'details'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [userDetails, setUserDetails] = useState({
    name: '',
    flatNumber: '',
    tower: 'A',
  });
  const [loading, setLoading] = useState(false);
  
  const { sendOTP, verifyOTP } = useAuth();
  const { toast } = useToast();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Demo mode: Skip Firebase OTP for testing
    if (phoneNumber === "+919876543210" || phoneNumber === "+919876543211" || phoneNumber === "+919876543212" || phoneNumber === "+919876543213") {
      // Store phone number for demo verification
      (window as any).demoPhoneNumber = phoneNumber;
      setStep('otp');
      toast({
        title: "Demo Mode",
        description: "Use OTP: 123456 for demo login",
      });
      setLoading(false);
      return;
    }

    const result = await sendOTP(phoneNumber);
    if (result.success) {
      setStep('otp');
      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code.",
      });
    } else {
      toast({
        title: "Demo Mode Available",
        description: "Use +919876543210 (admin) or +919876543211 (resident) for demo",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await verifyOTP(otp, userDetails);
    if (result.success) {
      toast({
        title: "Welcome!",
        description: "You have been successfully logged in.",
      });
    } else {
      if (result.error?.includes('user')) {
        setStep('details');
      } else {
        toast({
          title: "Error",
          description: result.error || "Invalid OTP",
          variant: "destructive",
        });
      }
    }
    setLoading(false);
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await verifyOTP(otp, userDetails);
    if (result.success) {
      toast({
        title: "Registration Complete!",
        description: "Welcome to RWA Sathi!",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Registration failed",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <i className="fas fa-building text-4xl text-primary"></i>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('appTitle')}</h1>
              <p className="text-sm text-gray-600">Resident Welfare Management</p>
            </div>
          </div>
          <div className="flex justify-center">
            <LanguageToggle />
          </div>
        </div>

        {/* Demo Login Panel */}
        <Card className="mb-4 border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <h3 className="font-semibold text-blue-800 mb-2">Demo Login (Testing)</h3>
            <p className="text-sm text-blue-700 mb-3">Use these credentials for testing:</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Admin:</span>
                <span>+919876543210</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Resident:</span>
                <span>+919876543211</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">OTP:</span>
                <span>123456</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {step === 'phone' && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <Label htmlFor="phone">{t('phoneNumber')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t('enterPhoneNumber')}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('loading') : 'Send OTP'}
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <Label htmlFor="otp">{t('enterOTP')}</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('loading') : t('verifyOTP')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep('phone')}
                  className="w-full"
                >
                  Change Phone Number
                </Button>
              </form>
            )}

            {step === 'details' && (
              <form onSubmit={handleCompleteRegistration} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">Complete your registration</p>
                </div>
                <div>
                  <Label htmlFor="name">{t('name')}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={userDetails.name}
                    onChange={(e) => setUserDetails(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="flatNumber">{t('flatNumber')}</Label>
                  <Input
                    id="flatNumber"
                    type="text"
                    placeholder="e.g., 301"
                    value={userDetails.flatNumber}
                    onChange={(e) => setUserDetails(prev => ({ ...prev, flatNumber: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tower">{t('tower')}</Label>
                  <select
                    id="tower"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={userDetails.tower}
                    onChange={(e) => setUserDetails(prev => ({ ...prev, tower: e.target.value }))}
                  >
                    <option value="A">Tower A</option>
                    <option value="B">Tower B</option>
                    <option value="C">Tower C</option>
                  </select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('loading') : 'Complete Registration'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Recaptcha container */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}
