import PageMeta from '../components/PageMeta'

const external = { target: '_blank', rel: 'noopener noreferrer' }

export default function Privacy() {
  return (
    <main>
      <PageMeta
        title="Privacy Policy | Voltorb Flip"
        description="What personal data Voltorb Flip collects when you sign in, why it's collected, and how it's used."
        path="/privacy"
      />

      <header className="page-intro">
        <h2 className="page-title">Privacy policy</h2>
        <p className="page-lede">Last updated: August 2026</p>
      </header>

      <div className="prose">
        <h3>Overview</h3>
        <p>
          Voltorb Flip by Draglash Games is committed to protecting your privacy and ensuring the security of your
          personal data. This policy explains what personal data we collect, why we collect it, and how it is used.
          By using the app, you agree to the practices described here.
        </p>

        <h3>What data we collect</h3>
        <p>When you sign in with Google, we receive and store:</p>
        <ul>
          <li>Your Google account display name</li>
          <li>Your Google account email address</li>
          <li>A unique user ID assigned by our authentication provider</li>
        </ul>
        <p>We also store game data associated with your account:</p>
        <ul>
          <li>Your number of coins</li>
          <li>Your shop inventory</li>
        </ul>
        <p>If you play without signing in, nothing is stored on our servers.</p>

        <h3>How we use your data</h3>
        <p>Your data is used solely to:</p>
        <ul>
          <li>Identify your account and keep you signed in</li>
          <li>Save your number of coins</li>
          <li>Sync your inventory across devices</li>
        </ul>
        <p>We do not use your data for advertising, profiling, or any purpose beyond operating the app.</p>

        <h3>Data storage and security</h3>
        <p>
          Your data is stored securely using Supabase, a third-party database provider, on servers within Southeast
          Asia. Supabase's own privacy policy is available at{' '}
          <a href="https://supabase.com/privacy" {...external}>supabase.com/privacy</a>. Access to your data is
          restricted by Row Level Security policies, meaning only you can read or modify your own game records. We do
          not have access to your Google account password.
        </p>

        <h3>Data sharing</h3>
        <p>
          We do not sell, rent, or share your personal data with any third parties, advertisers, or analytics
          services. The only third-party services involved in running this website are:
        </p>
        <ul>
          <li>
            <strong>Google OAuth</strong> - for sign-in only. Google's{' '}
            <a href="https://policies.google.com/privacy" {...external}>privacy policy</a> applies to their own
            handling of your data.
          </li>
          <li>
            <strong>Supabase</strong> - for database storage. See{' '}
            <a href="https://supabase.com/privacy" {...external}>supabase.com/privacy</a>.
          </li>
          <li>
            <strong>Vercel</strong> - for hosting. See{' '}
            <a href="https://vercel.com/legal/privacy-policy" {...external}>vercel.com/legal/privacy-policy</a>.
          </li>
        </ul>

        <h3>Contact</h3>
        <p>
          If you have any questions about this privacy policy or wish to request data deletion, please contact us
          at: <a href="mailto:draglashgames@gmail.com">draglashgames@gmail.com</a>.
        </p>
      </div>
    </main>
  )
}
