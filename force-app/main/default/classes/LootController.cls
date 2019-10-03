public with sharing class LootController {
    
    @AuraEnabled(cacheable=true)
    public static List<Campaign_Prize_Item__c> getCampaignPrizeItems(String userId){
        List<User> currUser = [SELECT Id, Name, Email, Region__c FROM User WHERE Id =:userId];
        String currUser_Region = currUser[0].Region__c;
        String currUser_Email = currUser[0].Email;
        List<Campaign_Prize_Item__c> availablePrizes = new List<Campaign_Prize_Item__c>();
      
        if(currUser.size()>0 && !''.equals(currUser_Region) && currUser_Region!=null){
            List<Loot_Campaign__c> activeLootCampaigns = [SELECT Id, Name, Active__c, Region__c FROM Loot_Campaign__c WHERE Region__c = :currUser_Region AND Active__c=true];
            if(activeLootCampaigns.size()>0){
               Loot_Campaign__c currLootCampaign = activeLootCampaigns[0];
               List<Selected_Loot_Items__c> chosenItems = new List<Selected_Loot_Items__c>();
               chosenItems = [SELECT Id,Name, Participant__c, Participant__r.Participant_Email__c, Preference__c, Prize__c, Prize__r.Campaign__c,  Prize__r.Name FROM Selected_Loot_Items__c WHERE Participant__r.Participant_Email__c = :currUser_Email AND Prize__r.Campaign__c = :currLootCampaign.Id];
               availablePrizes = [SELECT Id, Name, Prize__c, Prize__r.Name, Prize__r.Prize_Image_URL__c, Campaign__c FROM Campaign_Prize_Item__c WHERE Campaign__c =:currLootCampaign.Id];
               System.debug(availablePrizes);
            }
        }
        return availablePrizes;
    }

    @AuraEnabled
    public static List<Selected_Loot_Items__c> getSelectedLootItems(String userId){
        List<User> currUser = [SELECT Id, Name, Email, Region__c FROM User WHERE Id =:userId];
        List<Selected_Loot_Items__c> selectedItems = new List<Selected_Loot_Items__c>();
        if(currUser.size()>0){
            String currUser_Region = currUser[0].Region__c;
            String currUser_Email = currUser[0].Email;
            if(!''.equals(currUser_Region) && currUser_Region!=null){
            List<Loot_Campaign__c> activeLootCampaigns = [SELECT Id, Name, Active__c, Region__c FROM Loot_Campaign__c WHERE Region__c = :currUser_Region AND Active__c=true];
                if(activeLootCampaigns.size()>0){
                    Loot_Campaign__c currLootCampaign = activeLootCampaigns[0];
                    selectedItems = [SELECT Id, Prize__c, Prize__r.Campaign__c, Preference__c  FROM Selected_Loot_Items__c WHERE Participant__r.Participant_Email__c = :currUser_Email AND Prize__r.Campaign__c = :currLootCampaign.Id ORDER BY Preference__c ASC ];
                }
            }
        }
        return selectedItems;
    }

    @AuraEnabled
    public static String createParticipant(String userId){
        String message = '';
        List<User> currUser = [SELECT Id, Name, Email, Region__c FROM User WHERE Id =:userId];
        String currUser_Email = currUser[0].Email;
        String currUser_Region = currUser[0].Region__c;
        String currUser_Name = currUser[0].Name;
        List<Participant__c> participants = [SELECT Id, Participant_Email__c FROM Participant__c WHERE Participant_Email__c =:currUser_Email];
        if(participants.size()<=0){
            Participant__c participant = new Participant__c();
            participant.Participant_Email__c = currUser_Email;
            participant.Region__c = currUser_Region;
            participant.Name = currUser_Name;
            message = 'Participant Created';
            insert participant;
        }else {
            message = 'Participant exists';
        }

        return message;
    }

    @AuraEnabled
    public static String createSelectedLootItems(String selectedPrizes, String userId, String campaignId){
        String message = 'No action taken';
        List<User> currUser = [SELECT Id, Name, Email, Region__c FROM User WHERE Id =:userId];
        String currUser_Email = currUser[0].Email;
        
        List<Participant__c> participant = [SELECT Id, Participant_Email__c FROM Participant__c WHERE Participant_Email__c =:currUser_Email];
        
        List<Selected_Loot_Items__c> slis = new List<Selected_Loot_Items__c>();
        
        List<Selected_Loot_Items__c> deleteSlis = new List<Selected_Loot_Items__c>();

        List<Selected_Loot_Items__c> updateSlis = new List<Selected_Loot_Items__c>();
        
        List<String> prizeIds = selectedPrizes.split(',');
        
        if(prizeIds.size()>0 && participant.size()>0){
            List<Selected_Loot_Items__c> existingSlis = [SELECT Id, Prize__c,Preference__c FROM Selected_Loot_Items__c WHERE Prize__r.Campaign__c=:campaignId ORDER BY Preference__c ASC];
            List<String> existingIds = new List<String>();
            Integer count = 1;

            for(Selected_Loot_Items__c esli : existingSlis){
                if(prizeIds.indexOf(esli.Prize__c)==-1){
                    deleteSlis.add(esli);
                } else{
                    existingIds.add(esli.Prize__c);
                }
            }
            for(Integer i=0;i<prizeIds.size();i++){
                if(existingIds.indexOf(prizeIds[i])==-1 && !''.equals(prizeIds[i])){
                    Selected_Loot_Items__c sli = new Selected_Loot_Items__c();
                    sli.Participant__c = participant[0].Id;
                    sli.Preference__c = i+1;
                    sli.Prize__c = prizeIds[i];
                    slis.add(sli);
                }else{
                    for(Selected_Loot_Items__c esli : existingSlis){
                        if(!''.equals(prizeIds[i]) &&  prizeIds[i] == esli.Prize__c){    
                            esli.Preference__c = i+1;
                            updateSlis.add(esli);
                            break;
                        }
                    }
                }
            }
            if(slis.size()>0){
                insert slis;
                message = 'Selected Loot Items inserted';
            }
            if(updateSlis.size()>0){
                update updateSlis;
                message = message+' Items Updated As Well';
            }
            if(deleteSlis.size()>0){
                delete deleteSlis;
                message = message+' Items Deleted As Well';
            }
        }
        return message;
    }

}
