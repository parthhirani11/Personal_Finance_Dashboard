import Account from "../models/Account.js";

// 🔥 COMMON SYNC FUNCTION
export const syncSettlementAccounts = async (settlement) => {
  await Account.updateMany(
    { settlementId: settlement._id, userId: settlement.fromUserId },
    { dashboardIds: [settlement.fromDashboardId] }
  );

  await Account.updateMany(
    { settlementId: settlement._id, userId: settlement.toUserId },
    { dashboardIds: [settlement.toDashboardId] }
  );
};