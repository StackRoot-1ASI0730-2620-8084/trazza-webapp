import {User} from "../domain/model/user.entity.js";
import {Driver, SavedAddress, Vehicle} from "../domain/model/fleet.entities.js";

/**
 * Converts IAM resources of the API into entities and commands into resources.
 */
export const IamAssembler = {
    toUser(resource) {
        return new User({
            id: resource.id,
            email: resource.email,
            roles: resource.roles ?? [],
            fullName: resource.identity?.fullName ?? '',
            dniMasked: resource.identity?.dniMasked ?? '',
            phone: resource.identity?.phone ?? null,
            kycStatus: resource.identity?.kycStatus ?? null,
            carrierProfileId: resource.carrierProfile?.id ?? null,
            merchantProfile: resource.merchantProfile ?? null,
            createdAt: resource.createdAt
        });
    },

    toVehicle: resource => new Vehicle(resource),

    toVehicleResource: vehicle => ({
        plate: vehicle.plate,
        model: vehicle.model,
        maxLoadKg: vehicle.maxLoadKg,
        cargoLengthM: vehicle.cargoLengthM,
        cargoWidthM: vehicle.cargoWidthM,
        cargoHeightM: vehicle.cargoHeightM,
        cargoVolumeM3: vehicle.cargoVolumeM3 || null,
        photoS3Key: vehicle.photoS3Key || null,
        isActive: vehicle.isActive
    }),

    toDriver: resource => new Driver(resource),

    toDriverResource: driver => ({
        fullName: driver.fullName,
        sex: driver.sex || null,
        experienceStars: driver.experienceStars,
        isActive: driver.isActive
    }),

    toSavedAddress: resource => new SavedAddress(resource)
};
