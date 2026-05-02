const Device = require("../models/Device");
const Plant = require("../models/Plant");

function sameId(a, b) {
  return String(a) === String(b);
}

async function findUniqueOwnerForSector(sector) {
  if (!sector) return null;

  const ownerIds = await Plant.distinct("owner", { sector });
  if (ownerIds.length !== 1) {
    return null;
  }

  return ownerIds[0];
}

async function ensureDeviceOwner(device, sector) {
  if (!device) {
    return { ownerId: null, assigned: false, reason: "device_not_found" };
  }

  if (device.owner) {
    if (sector && device.sector !== sector) {
      device.sector = sector;
      await device.save();
    }
    return { ownerId: device.owner, assigned: false, reason: null };
  }

  const ownerId = await findUniqueOwnerForSector(sector);
  if (!ownerId) {
    return { ownerId: null, assigned: false, reason: "owner_not_resolved" };
  }

  device.owner = ownerId;
  if (sector) {
    device.sector = sector;
  }
  await device.save();

  return { ownerId, assigned: true, reason: null };
}

async function findVisibleDevicesForUser(userId) {
  const ownedDevices = await Device.find({ owner: userId }).sort({ createdAt: -1 });
  const byId = new Map(ownedDevices.map((device) => [device.deviceId, device]));

  const userSectors = await Plant.distinct("sector", { owner: userId });
  for (const sector of userSectors) {
    const uniqueOwner = await findUniqueOwnerForSector(sector);
    if (!uniqueOwner || !sameId(uniqueOwner, userId)) {
      continue;
    }

    const sectorDevices = await Device.find({
      sector,
      $or: [{ owner: { $exists: false } }, { owner: null }],
    }).sort({ createdAt: -1 });

    for (const device of sectorDevices) {
      byId.set(device.deviceId, device);
    }
  }

  return Array.from(byId.values()).sort((a, b) => b.createdAt - a.createdAt);
}

module.exports = {
  ensureDeviceOwner,
  findUniqueOwnerForSector,
  findVisibleDevicesForUser,
};
