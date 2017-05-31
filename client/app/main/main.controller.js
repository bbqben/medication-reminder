'use strict';

angular.module('medicationReminderApp').controller('MainCtrl', mainController);



function mainController($scope, $http, $window){
    var vm = this;
    vm.meds = $scope.meds;
    vm.activeMedication = {};
    vm.audioAlert = new Audio('../../assets/audio/alert_daniel_simon.mp3'); // Audio for alert
    vm.updateMed = updateMed;
    vm.markCompleted = markCompleted;

    function playAlert(vol){ // Function used to play alert with specified volume (volume range: 0 - 1)
        vm.audioAlert.volume = vol;
        vm.audioAlert.play();
    }

    function organizeTime(meds) { // Used to initialize medication data for application use
        var sortedMeds = meds.map(function(med, i) { // Going through the array of medication
            med.parsedTime = (moment(med.time).format("HH:mm")); // Storing parsed time, used to display on DOM
            return med;
        })
        return sortedMeds
    }

    function updateMed(meds) { // Used to update medication object
        var sortedMeds = meds.map(function(med, i) { // Cycles through medicine array

            if ( moment().format("DD") === moment(med.time).format("DD") ) { // Checks if the medicincation is to be administered on the current day
                med.sameDay = true;
            } else {
                med.sameDay = false;
            };


            if (med.status !== "COMPLETED") { // Checks if medication has already been administered
                if ( (moment(med.time).diff(moment(), "minutes") > -5) && (moment(med.time).diff(moment(), "minutes") < 5) ) { // Checks if medication can be marked completed (available to mark from 5 minutes before and after indicated time)
                    med.status = "PENDING";
                    med.canMark = true;
                } else if ( moment(med.time).diff(moment(), "minutes") > 0 ) { // Checks if medication is not yet ready to mark, but also not missed
                    med.status = "PENDING";
                    med.canMark = false;

                } else { // Everything else is indicated as missed as the mediciation should have already been administered
                    med.status = "MISSED";
                    med.canMark = false;
                }
            }

            if ((moment(med.time).diff(moment(), "seconds") === -1) && (med.status === "PENDING")) { // Checks if it is time to administer medication
                alert(med.name + " may now be administered!"); // Opens an alert to indicate medication time
                playAlert(0.5); // Plays an audio cue along with alert
            } else if ((moment(med.time).diff(moment(), "seconds") === -300) && (med.status === "PENDING")) { // Checks if 5 minutes have passed after medication time and it has not yet been administered
                // Play audio cues on loudest volume and 
                playAlert(1);
            }

            return med;
        })

    return sortedMeds;
    }

    function markCompleted(med) { // Function to allow user to mark medication as administered
        med.status = "COMPLETED";
    }


    var start = moment().format('MM/DD/YYYY'),
        end = moment().add(1, 'day').format('MM/DD/YYYY');

    $http.get('/api/medications?start=' + start + '&end=' + end).then(function (meds) {
        $scope.meds = organizeTime(meds.data);
    });

    $window.setInterval(function () {
        $scope.currentTime = moment().format('h:mm:ss a');
        $scope.currentDate = moment().format("MMMM Do")
        $scope.$apply();

        $scope.meds = updateMed($scope.meds); // Medication information is checked and updated every second


    }, 1000);




}