import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/auth">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Button>
          </Link>
        </div>

        <Card className="backdrop-blur-sm border-border/60">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>Account Information:</strong> When you create an account, we collect your username, email address, 
                  name, and professional role. If you use Google Sign-In, we may also collect your profile picture.
                </p>
                <p>
                  <strong>Sales Data:</strong> We collect and store the sales goals, tasks, check-ins, and performance metrics 
                  you enter into the platform to provide personalized guidance and track your progress.
                </p>
                <p>
                  <strong>Usage Information:</strong> We collect information about how you interact with our platform, 
                  including login times, feature usage, and technical data for improving our services.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>We use your information to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Provide personalized sales coaching and accountability features</li>
                  <li>Track your progress toward sales goals and generate insights</li>
                  <li>Send you check-in reminders and notifications (with your consent)</li>
                  <li>Improve our AI guidance system with anonymized usage patterns</li>
                  <li>Maintain and improve platform security and performance</li>
                  <li>Communicate with you about your account and platform updates</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>We do not sell, rent, or share your personal information with third parties</strong> except in 
                  the following limited circumstances:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Service Providers:</strong> We may share data with trusted service providers who help us operate the platform (e.g., hosting, email delivery, AI services)</li>
                  <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and users' safety</li>
                  <li><strong>Business Transfers:</strong> In the event of a merger or acquisition, user data may be transferred as part of the business assets</li>
                </ul>
                <p>
                  All service providers are contractually bound to protect your data and use it only for the services they provide to us.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  We implement industry-standard security measures to protect your data, including:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Encrypted data transmission using HTTPS</li>
                  <li>Secure password hashing and storage</li>
                  <li>Regular security updates and monitoring</li>
                  <li>Limited access to personal data on a need-to-know basis</li>
                </ul>
                <p>
                  While we strive to protect your information, no internet transmission is 100% secure. 
                  Please use strong passwords and keep your account credentials confidential.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Your Privacy Rights</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information in your account</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                  <li><strong>Portability:</strong> Request your data in a portable format</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications or notifications</li>
                </ul>
                <p>
                  To exercise these rights, contact us at the email address provided below. We will respond to 
                  your request within 30 days.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  We retain your data for as long as your account is active or as needed to provide services. 
                  When you delete your account, we will remove your personal data within 30 days, except for:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Data required for legal compliance or dispute resolution</li>
                  <li>Anonymized usage data for platform improvement</li>
                  <li>Financial records as required by law</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Third-Party Services</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  Sales Sherpa integrates with third-party services to enhance functionality:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Google Sign-In:</strong> For convenient authentication (governed by Google's Privacy Policy)</li>
                  <li><strong>OpenAI:</strong> For AI-powered coaching responses (data is processed according to OpenAI's terms)</li>
                  <li><strong>Email Services:</strong> For account verification and notifications</li>
                </ul>
                <p>
                  Please review the privacy policies of these services to understand how they handle your data.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Cookies and Tracking</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  We use essential cookies to maintain your login session and platform functionality. 
                  We do not use tracking cookies for advertising purposes. You can disable cookies in your 
                  browser settings, but this may affect platform functionality.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Children's Privacy</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  Sales Sherpa is intended for professional use by adults. We do not knowingly collect 
                  information from children under 13. If we become aware that we have collected such 
                  information, we will delete it promptly.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  We may update this privacy policy periodically. We will notify you of significant changes 
                  by email or through the platform. Your continued use of Sales Sherpa after changes 
                  constitutes acceptance of the updated policy.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  If you have questions about this privacy policy or how we handle your data, please contact us at:
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p><strong>Email:</strong> privacy@salessherpa.com</p>
                  <p><strong>Subject:</strong> Privacy Policy Inquiry</p>
                </div>
                <p>
                  We are committed to addressing your privacy concerns promptly and transparently.
                </p>
              </div>
            </section>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground">
                This privacy policy was last updated on {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} and is effective immediately for all users of the Sales Sherpa platform.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}