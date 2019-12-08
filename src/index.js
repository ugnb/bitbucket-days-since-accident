import $ from 'jquery'
import moment from 'moment';
import FlipClock from 'flipclock';
import './styles/style.scss'

const appHeight = () => {
    const doc = document.documentElement;
    doc.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
};
window.addEventListener('resize', appHeight);
appHeight();

function getUnresolvedIncidents() {
    return new Promise(
        (resolve, reject) => {
            let bitbucketStatusPage = new StatusPage.page({page: 'bqlf8qjztdtr'});
            bitbucketStatusPage.incidents({
                filter: 'unresolved',
                success: function (data) {
                    resolve(data.incidents || []);
                }
            })
        }
    );
}

function getIncidents() {
    return new Promise(
        (resolve, reject) => {
            let bitbucketStatusPage = new StatusPage.page({page: 'bqlf8qjztdtr'});
            bitbucketStatusPage.incidents({
                success: function (data) {
                    resolve(data.incidents || []);
                }
            })
        }
    );
}

function setCounter(value, counter) {
    if (!counter.value || counter.value.value === undefined || value === counter.value) { return; }

    let interval = setInterval(() => {
        if (value === counter.value.value) {
            clearInterval(interval);
            return;
        }
        if (value > counter.value.value) {
            counter.increment();
        } else {
            counter.decrement();
        }
    }, 500);
}

function getDaysDiff(date1, date2) {
    return moment(date1).diff(moment(date2), 'days');
}

function setSinceCounter(incidents, sinceCounter) {
    if (incidents.length) {
        if (incidents.find(incident => (incident.status !== 'resolved' && incident.status !== 'postmortem'))) {
            setCounter(0, sinceCounter);
            return;
        }

        let lastEvent = incidents[0];
        if (lastEvent.resolved_at) {
            setCounter(getDaysDiff(new Date(), new Date(lastEvent.resolved_at)), sinceCounter);
        }
    }
}

function setRecordCounter(incidents, recordCounter) {
    if (incidents.length) {
        let lastIncident = incidents[0];
        let maxDiff = getDaysDiff(new Date(), new Date(lastIncident.resolved_at));

        for (let i = 0; i < incidents.length; i++) {
            let incident = incidents[i];

            if (incident.status !== 'resolved' && incident.status !== 'postmortem') {
                continue;
            }

            let nextDiff = getDaysDiff(new Date(lastIncident.resolved_at), new Date(incident.created_at));
            if (nextDiff > maxDiff) {
                maxDiff = nextDiff;
            }
            lastIncident = incident;
        }

        setCounter(maxDiff, recordCounter);
    }
}

function refreshAll(recordCounter, sinceCounter) {
    getIncidents()
        .then((incidents) => {
            setSinceCounter(incidents, sinceCounter);
            setRecordCounter(incidents, recordCounter);
        });

    getUnresolvedIncidents().then((unresolved) => {
        if (!unresolved.length) {
            $('#current-incident').addClass('hidden');
            $('#current-incident-text').html('');
            return;
        }
        $('#current-incident').removeClass('hidden');
        $('#current-incident-text').html(`Oh no! ${unresolved[0].name}`)
    });
}

$(document).ready(() => {
    let recordCounter = new FlipClock($('#days-record-counter')[0], 0, {autoPlay: false, autoStart: false});
    let sinceCounter = new FlipClock($('#days-since-counter')[0], 0, {autoPlay: false, autoStart: false});

    refreshAll(recordCounter, sinceCounter);
    let refreshInterval = setInterval(() => {
        refreshAll(recordCounter, sinceCounter);
    }, 60000);
});
