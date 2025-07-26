import React, { useState } from "react";
import { IncomeForm } from "../../components/IncomeForm/IncomeForm";
import { IncomeTracker } from "../../components/IncomeTracker/IncomeTracker";
import "./Home.css";

const Home: React.FC = () => {
  const [userSettingsId, setUserSettingsId] = useState<string | null>(null);

  const handleSettingsCreated = (settingsId: string) => {
    setUserSettingsId(settingsId);
  };

  const handleReset = () => {
    setUserSettingsId(null);
  };

  return (
    <div className="home">
      <div className="home__container">
        <header className="home__header">
          <h1 className="home__title">Income Tracker</h1>
          <p className="home__subtitle">
            Track your real-time earnings and see your money grow as you work
          </p>
        </header>

        <main className="home__main">
          {!userSettingsId ? (
            <IncomeForm onSettingsCreated={handleSettingsCreated} />
          ) : (
            <IncomeTracker
              userSettingsId={userSettingsId}
              onReset={handleReset}
            />
          )}
        </main>

        <footer className="home__footer">
          <p className="home__footer-text">&copy; Built with ❤️ by {"Vicky"}</p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
