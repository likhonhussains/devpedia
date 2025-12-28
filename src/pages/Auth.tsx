import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Camera, MapPin, FileText, Upload, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().trim().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters').regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  displayName: z.string().trim().min(2, 'Display name must be at least 2 characters').max(50, 'Display name must be less than 50 characters'),
  bio: z.string().max(160, 'Bio must be less than 160 characters').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  gender: z.string().optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    displayName: '',
    bio: '',
    location: '',
    gender: '',
  });

  if (user) {
    navigate('/');
    return null;
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image under 2MB',
          variant: 'destructive',
        });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;
    
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile, { upsert: true });
    
    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return null;
    }
    
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleNextStep = () => {
    const stepOneValidation = z.object({
      email: z.string().trim().email('Invalid email address'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      username: z.string().trim().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters').regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
      displayName: z.string().trim().min(2, 'Display name must be at least 2 characters').max(50, 'Display name must be less than 50 characters'),
    }).safeParse(formData);

    if (!stepOneValidation.success) {
      toast({
        title: 'Validation Error',
        description: stepOneValidation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const validation = loginSchema.safeParse(formData);
        if (!validation.success) {
          toast({
            title: 'Validation Error',
            description: validation.error.errors[0].message,
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);
        
        if (error) {
          let message = error.message;
          if (error.message.includes('Invalid login credentials')) {
            message = 'Invalid email or password. Please try again.';
          }
          toast({
            title: 'Login Failed',
            description: message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully logged in.',
          });
          navigate('/');
        }
      } else {
        const validation = signupSchema.safeParse(formData);
        if (!validation.success) {
          toast({
            title: 'Validation Error',
            description: validation.error.errors[0].message,
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(
          formData.email, 
          formData.password, 
          formData.username.toLowerCase(), 
          formData.displayName
        );
        
        if (error) {
          let message = error.message;
          if (error.message.includes('User already registered')) {
            message = 'An account with this email already exists. Try logging in instead.';
          }
          toast({
            title: 'Sign Up Failed',
            description: message,
            variant: 'destructive',
          });
        } else {
          // Get the newly created user and update profile with additional info
          const { data: { user: newUser } } = await supabase.auth.getUser();
          
          if (newUser) {
            let avatarUrl = null;
            if (avatarFile) {
              avatarUrl = await uploadAvatar(newUser.id);
            }
            
            await supabase
              .from('profiles')
              .update({
                bio: formData.bio || null,
                location: formData.location || null,
                gender: formData.gender || null,
                ...(avatarUrl && { avatar_url: avatarUrl }),
              })
              .eq('user_id', newUser.id);
          }
          
          toast({
            title: 'Account created!',
            description: 'Welcome to Basic Comet. Start sharing your knowledge!',
          });
          navigate('/');
        }
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoginForm = () => (
    <>
      {/* Email */}
      <div>
        <label className="text-sm font-medium mb-2 block">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="you@example.com"
            className="w-full bg-card border border-border/50 rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            required
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="text-sm font-medium mb-2 block">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            minLength={6}
            className="w-full bg-card border border-border/50 rounded-lg py-2.5 pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full gap-2 mt-6"
        size="lg"
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"
          />
        ) : (
          <>
            Sign In
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </>
  );

  const renderSignupStep1 = () => (
    <>
      {/* Email */}
      <div>
        <label className="text-sm font-medium mb-2 block">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="you@example.com"
            className="w-full bg-card border border-border/50 rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            required
          />
        </div>
      </div>

      {/* Username */}
      <div>
        <label className="text-sm font-medium mb-2 block">Username</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
            placeholder="username"
            maxLength={20}
            className="w-full bg-card border border-border/50 rounded-lg py-2.5 pl-8 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors font-mono"
            required
          />
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label className="text-sm font-medium mb-2 block">Display Name</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            placeholder="Your Name"
            maxLength={50}
            className="w-full bg-card border border-border/50 rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            required
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="text-sm font-medium mb-2 block">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            minLength={6}
            className="w-full bg-card border border-border/50 rounded-lg py-2.5 pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Next Button */}
      <Button
        type="button"
        onClick={handleNextStep}
        className="w-full gap-2 mt-6"
        size="lg"
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </Button>
    </>
  );

  const renderSignupStep2 = () => (
    <>
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <div className="w-8 h-0.5 bg-primary" />
        <div className="w-2 h-2 rounded-full bg-primary" />
      </div>

      {/* Avatar Upload */}
      <div className="flex flex-col items-center mb-4">
        <label className="text-sm font-medium mb-3 block">Profile Picture</label>
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative w-24 h-24 rounded-[10px] bg-card border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors cursor-pointer overflow-hidden group"
        >
          {avatarPreview ? (
            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground group-hover:text-primary transition-colors">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs">Add photo</span>
            </div>
          )}
          {avatarPreview && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
        <p className="text-xs text-muted-foreground mt-2">Optional • Max 2MB</p>
      </div>

      {/* Bio */}
      <div>
        <label className="text-sm font-medium mb-2 block">Bio</label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell us about yourself..."
            maxLength={160}
            rows={3}
            className="w-full bg-card border border-border/50 rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors resize-none"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-right">{formData.bio.length}/160</p>
      </div>

      {/* Location */}
      <div>
        <label className="text-sm font-medium mb-2 block">Location</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="City, Country"
            maxLength={100}
            className="w-full bg-card border border-border/50 rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className="text-sm font-medium mb-2 block">Gender</label>
        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
          <Select
            value={formData.gender}
            onValueChange={(value) => setFormData({ ...formData, gender: value })}
          >
            <SelectTrigger className="w-full bg-card border border-border/50 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-primary/50 transition-colors h-auto">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border">
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="non-binary">Non-binary</SelectItem>
              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(1)}
          className="flex-1"
          size="lg"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 gap-2"
          size="lg"
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"
            />
          ) : (
            <>
              Create Account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-radial from-primary/5 via-background to-background">
      <main className="relative z-10 w-full max-w-sm mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">B</span>
            </div>
            <span className="font-semibold text-lg">Basic Comet</span>
          </Link>
          <h1 className="text-2xl font-semibold mb-2">
            {isLogin ? 'Welcome back' : (step === 1 ? 'Create account' : 'Complete your profile')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLogin 
              ? 'Sign in to continue'
              : (step === 1 ? 'Join the developer community' : 'Add some personal touches')
            }
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          key={`${isLogin}-${step}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {isLogin ? renderLoginForm() : (step === 1 ? renderSignupStep1() : renderSignupStep2())}

          {/* Toggle Login/Signup - only on first step */}
          {(isLogin || step === 1) && (
            <p className="text-center text-sm text-muted-foreground pt-4">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setStep(1);
                  setAvatarFile(null);
                  setAvatarPreview(null);
                  setFormData({ email: '', password: '', username: '', displayName: '', bio: '', location: '', gender: '' });
                }}
                className="text-primary hover:underline ml-1 font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}
        </motion.form>

        {/* Back to home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8"
        >
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </Link>
        </motion.div>
      </main>
    </div>
  );
};

export default Auth;
