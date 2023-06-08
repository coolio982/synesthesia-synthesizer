from utils import synth


def play_synths(objectDetails, synths):
    for obj in objectDetails:
        if (obj["obj"] == "gesture"):
            # do some gesture mapping for global things
            pass
        else:
            # it's an individual action on the object
            if (obj["action"] == "touch"):
                synths[obj["id"]].play_osc()
            else:
                synths[obj["id"]].stop_osc()