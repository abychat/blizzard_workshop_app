/* eslint-disable no-console */
import { LightningElement, track, wire } from "lwc";
import Id from "@salesforce/user/Id";
import getCampaignPrizeItems from "@salesforce/apex/LootController.getCampaignPrizeItems";

export default class LootImageCarousel extends LightningElement {
  userId = Id;
  @track imageInfo = [];
  @track prizeItems;
  @track renderComponent = false;

  @wire(getCampaignPrizeItems, { userId: "$userId" }) availablePrizeItems({
    error,
    data
  }) {
    if (data) {
      this.prizeItems = data;
      if (this.prizeItems.length > 0) {
        this.renderComponent = true;
      }
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.prizeItems = undefined;
    }
  }

  get carouselImages() {
    if (this.prizeItems !== undefined && this.prizeItems.length > 0) {
      for (let i = 0; i < this.prizeItems.length; i++) {
        let prizeName = this.prizeItems[i].Prize__r.Name;
        console.log(prizeName);
        let prizeImageUrl = this.prizeItems[i].Prize__r.Prize_Image_URL__c;
        console.log(prizeImageUrl);
        let prizeId = this.prizeItems[i].Id;
        let prizeInfo = { name: prizeName, url: prizeImageUrl, id: prizeId };
        this.imageInfo.push(prizeInfo);
      }
    }
    return this.imageInfo;
  }
}
