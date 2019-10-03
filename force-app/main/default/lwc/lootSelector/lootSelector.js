/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
import { LightningElement, track, wire } from "lwc";
import Id from "@salesforce/user/Id";
import LOOT_BACKGROUND from '@salesforce/resourceUrl/loot_background';
import NO_HEADER from '@salesforce/resourceUrl/no_header';
import { loadStyle } from 'lightning/platformResourceLoader';
import getCampaignPrizeItems from "@salesforce/apex/LootController.getCampaignPrizeItems";
import getSelectedLootItems from "@salesforce/apex/LootController.getSelectedLootItems";
import createParticipant from "@salesforce/apex/LootController.createParticipant";
import createSelectedLootItems from "@salesforce/apex/LootController.createSelectedLootItems";
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
export default class DualListboxSimple extends LightningElement {
  @track _selected = [];
  @track prizeItems;
  @track selectedItems;
  @track error;
  @track isLoading = false;
  @track recordSaved = false;
  @track actionMessage = "";
  @track recordError = false;
  @track isRecordSubmitted = false;
  @track participantCreationMessage = "";
  @track itemSaveMessage = "";
  @track selectedValues = [];
  @track noData = true;
  @track dataLoaded = false;
  @track isButtonDisabled = true;
  @track showNoItems = false;
  
  backgroundUrl = LOOT_BACKGROUND;
  noHeader = NO_HEADER;
  campaignId = "";
  userId = Id;
  connectedCallback() {
    loadStyle(this, this.noHeader);
    this.isButtonDisabled = true;
    this.actionMessage = "";
    createParticipant({ userId: this.userId })
      .then(result => {
        this.participantCreationMessage = result;
        console.log(this.participantCreationMessage);
        this.error = undefined;
      })
      .catch(error => {
        this.error = error;
        this.participantCreationMessage = "";
      });

    getSelectedLootItems({ userId: this.userId })
      .then(data => {
        this.selectedItems = data;
        let ops = [];
        this.dataLoaded = true;
        if (this.selectedItems.length > 0) {
          this.campaignId = this.selectedItems[0].Prize__r.Campaign__c;
          this.selectedItems = data;
          console.log(this.selectedItems.length);
          for (let i = 0; i < this.selectedItems.length; i++) {
            let value = this.selectedItems[i].Prize__c;
            ops.push(value);
          }
          this.selectedValues = ops;
        }
        this.error = undefined;
      })
      .catch(error => {
        this.error = error;
        console.log(error);
      });
  }
  @wire(getCampaignPrizeItems, { userId: "$userId" }) availablePrizeItems({
    error,
    data
  }) {
    if (data) {
      this.prizeItems = data;
      if (this.prizeItems.length <= 0) {
        this.noData = true;
        this.showNoItems = true;
      }else if (this.prizeItems.length > 0){
        this.noData = false;
      }
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.prizeItems = undefined;
    }
  }

  get options() {
    let availableOptions = [];
    if (this.prizeItems !== undefined) {
      this.campaignId = this.prizeItems[0].Campaign__c;
      for (let i = 0; i < this.prizeItems.length; i++) {
        let prizeItem = this.prizeItems[i];
        let label = prizeItem.Prize__r.Name;
        let value = prizeItem.Id;
        availableOptions.push({ label: label, value: value });
      }
    }
    return availableOptions;
  }

  get selected() {
    return this._selected.length ? this._selected : "none";
  }

  handleChange(e) {
    this._selected = e.detail.value;
    this.isButtonDisabled = false;
    this.actionMessage = "";
    console.log(this._selected.toString());
  }


  handleClick(e) {
    this.isRecordSubmitted = true;
    this.isLoading = true;
    createSelectedLootItems({
      selectedPrizes: this._selected.toString(),
      userId: this.userId,
      campaignId: this.campaignId
    })
      .then(result => {
        this.isLoading = false;
        this.itemSaveMessage = result;
        this.error = undefined;
        this.actionMessage = "Your selections were succesfully saved!";
        this.showNotification('Success',this.actionMessage, 'success');
        this.recordSaved = true;
        this.isButtonDisabled = true;
      })
      .catch(error => {
        this.isRecordSubmitted = false;
        this.recordError = true;
        this.error = error;
        this.isLoading = false;
        this.itemSaveMessage = "";
        this.actionMessage =
          "Uh Oh! There was a problem saving your selection. Please contact xyz@blizzard.com for assistance.";
        this.showNotification('Error',this.actionMessage, 'error');
        this.isButtonDisabled = true;

      });
  }

  get backgroundStyle() {
    let style=''
    if(!this.noData){
      style=`background-image:url(${this.backgroundUrl})`;
    }
    return style ;
}

showNotification(title, message, variant) {
  const evt = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant,
  });
  this.dispatchEvent(evt);
}
}
