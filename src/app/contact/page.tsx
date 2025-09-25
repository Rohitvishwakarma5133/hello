export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Contact Us</h1>
        <div className="space-y-6">
          <p className="text-lg text-slate-600">
            Have questions or need support? We&apos;d love to hear from you!
          </p>
          <div className="bg-slate-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Get in Touch</h2>
            <div className="space-y-2">
              <p className="text-slate-600">
                <strong>Email:</strong> hello@naturalwrite.com
              </p>
              <p className="text-slate-600">
                <strong>Support:</strong> Available 24/7
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}