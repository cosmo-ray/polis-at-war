function paw_action(paw, eves)
{
    print("action")
}

/*
 * This function should be callable from outside of the module
 * Take a card description and return create image in it
 */
function mk_card(canvas_wid, card)
{
    
}

function paw_init(paw)
{
    print("INIT !!!")
    print("INIT !!!")
    print("INIT !!!")
    print("INIT !!!")
    yeCreateFunction(paw_action, paw, "action")
    yeCreateString("rgba: 255 255 255 255", paw, "background")
    var cards = ygFileToEnt(YJSON, "./cards.json")
    yePushBack(paw, cards, "cards")
    print("cards:\n", yent_to_str(cards))
    ret = ywidNewWidget(paw, "canvas")
    for (i = 0; i < yeLen(cards); ++i) {
	let img_path = yeGetKeyAt(cards, i) + ".png"

	var img = ywCanvasNewImgByPath(paw, 0, 50 * i, img_path)
	print(img_path)
	print(yent_to_str(img))
    }
    return ret;
}

function mod_init(mod)
{
    var paw = yeCreateArray()

    yeCreateFunction(paw_init, paw, "callback")
    yeCreateString("polis-at-war", paw, "name")
    yeIncrRef(paw)
    ywidAddSubType(paw)

    var sw = yeCreateArray(mod, "starting widget")
    yeCreateString("polis-at-war", sw, "<type>")

    return mod
}
