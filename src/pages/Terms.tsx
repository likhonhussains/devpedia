import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import Header from '@/components/Header';

const Terms = () => {
  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="fixed inset-0 bg-gradient-radial from-primary/5 via-background to-background pointer-events-none" />
      
      <Header />

      <main className="relative z-10 flex-1 pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to home</span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card rounded-2xl p-8 md:p-12"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Terms of Service</h1>
                <p className="text-muted-foreground text-sm">Last updated: December 28, 2024</p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3 text-foreground">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing and using Basic Comet, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-foreground">2. Use License</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Permission is granted to temporarily access the materials (information or software) on Basic Comet for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
                  <li>Modify or copy the materials for commercial purposes</li>
                  <li>Use the materials for any commercial purpose or public display</li>
                  <li>Attempt to decompile or reverse engineer any software</li>
                  <li>Remove any copyright or proprietary notations</li>
                  <li>Transfer the materials to another person</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-foreground">3. User Account</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To access certain features of the platform, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-foreground">4. User Content</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You retain ownership of any content you submit, post, or display on or through Basic Comet. By posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, and distribute your content.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-foreground">5. Prohibited Conduct</h2>
                <p className="text-muted-foreground leading-relaxed">You agree not to:</p>
                <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on the rights of others</li>
                  <li>Post harmful, offensive, or inappropriate content</li>
                  <li>Attempt to gain unauthorized access to the platform</li>
                  <li>Interfere with the proper functioning of the service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-foreground">6. Disclaimer</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The materials on Basic Comet are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim all other warranties including, without limitation, implied warranties or conditions of merchantability.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-foreground">7. Limitations</h2>
                <p className="text-muted-foreground leading-relaxed">
                  In no event shall Basic Comet or its suppliers be liable for any damages arising out of the use or inability to use the materials on Basic Comet, even if we have been notified of the possibility of such damage.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-foreground">8. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-foreground">9. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at support@basiccomet.com.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Terms;
