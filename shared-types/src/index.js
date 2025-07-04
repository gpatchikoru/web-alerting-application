"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.UserRole = exports.EventType = exports.AlertStatus = exports.AlertSeverity = exports.AlertType = exports.KitchenCategory = exports.MedicineDosageForm = exports.ItemType = void 0;
// Inventory item types
var ItemType;
(function (ItemType) {
    ItemType["MEDICINE"] = "medicine";
    ItemType["KITCHEN"] = "kitchen";
})(ItemType || (exports.ItemType = ItemType = {}));
var MedicineDosageForm;
(function (MedicineDosageForm) {
    MedicineDosageForm["TABLET"] = "tablet";
    MedicineDosageForm["CAPSULE"] = "capsule";
    MedicineDosageForm["LIQUID"] = "liquid";
    MedicineDosageForm["INJECTION"] = "injection";
    MedicineDosageForm["CREAM"] = "cream";
    MedicineDosageForm["DROPS"] = "drops";
    MedicineDosageForm["INHALER"] = "inhaler";
    MedicineDosageForm["OTHER"] = "other";
})(MedicineDosageForm || (exports.MedicineDosageForm = MedicineDosageForm = {}));
var KitchenCategory;
(function (KitchenCategory) {
    KitchenCategory["GRAINS"] = "grains";
    KitchenCategory["SPICES"] = "spices";
    KitchenCategory["DAIRY"] = "dairy";
    KitchenCategory["VEGETABLES"] = "vegetables";
    KitchenCategory["FRUITS"] = "fruits";
    KitchenCategory["MEAT"] = "meat";
    KitchenCategory["BEVERAGES"] = "beverages";
    KitchenCategory["SNACKS"] = "snacks";
    KitchenCategory["CONDIMENTS"] = "condiments";
    KitchenCategory["OTHER"] = "other";
})(KitchenCategory || (exports.KitchenCategory = KitchenCategory = {}));
// Alert types
var AlertType;
(function (AlertType) {
    AlertType["LOW_STOCK"] = "low_stock";
    AlertType["EXPIRY_WARNING"] = "expiry_warning";
    AlertType["OUT_OF_STOCK"] = "out_of_stock";
    AlertType["EXPIRED"] = "expired";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "low";
    AlertSeverity["MEDIUM"] = "medium";
    AlertSeverity["HIGH"] = "high";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["ACTIVE"] = "active";
    AlertStatus["ACKNOWLEDGED"] = "acknowledged";
    AlertStatus["RESOLVED"] = "resolved";
    AlertStatus["DISMISSED"] = "dismissed";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
// Kafka event types
var EventType;
(function (EventType) {
    EventType["INVENTORY_CREATED"] = "inventory.created";
    EventType["INVENTORY_UPDATED"] = "inventory.updated";
    EventType["INVENTORY_DELETED"] = "inventory.deleted";
    EventType["STOCK_ADJUSTED"] = "stock.adjusted";
    EventType["ALERT_CREATED"] = "alert.created";
    EventType["ALERT_UPDATED"] = "alert.updated";
    EventType["ALERT_RESOLVED"] = "alert.resolved";
})(EventType || (exports.EventType = EventType = {}));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["USER"] = "user";
    UserRole["VIEWER"] = "viewer";
})(UserRole || (exports.UserRole = UserRole = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["ALERT"] = "alert";
    NotificationType["SYSTEM"] = "system";
    NotificationType["REMINDER"] = "reminder";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
// All types are already exported above 
//# sourceMappingURL=index.js.map