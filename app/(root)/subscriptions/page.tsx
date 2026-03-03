import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PricingTable } from "@clerk/nextjs";

const SubscriptionsPage = async () => {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="container wrapper py-10">
      <div className="flex flex-col items-center text-center mb-10">
        <h1 className="page-title-xl">Choose Your Plan</h1>
        <p className="subtitle">
          Upgrade to unlock more books, longer sessions, and advanced features.
        </p>
      </div>

      <div className="clerk-pricing-container">
        <PricingTable />
      </div>
    </div>
  );
};

export default SubscriptionsPage;
