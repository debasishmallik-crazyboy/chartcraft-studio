/**
 * After Effects / EffectCraft Automation Script
 * Imports ChartCraft ProRes 4444 MOV with Alpha directly into the active composition.
 */

(function importChartCraftToAE(chartFilePath) {
    if (!app.project) {
        alert("Please open an After Effects project first.");
        return;
    }

    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select or open a composition first.");
        return;
    }

    var file = new File(chartFilePath);
    if (!file.exists) {
        alert("Chart file not found: " + chartFilePath);
        return;
    }

    app.beginUndoGroup("Import ChartCraft Transparent Chart");

    var io = new ImportOptions(file);
    if (io.canImportAs(ImportAsType.FOOTAGE)) {
        io.importAs = ImportAsType.FOOTAGE;
        var footage = app.project.importFile(io);
        
        // Ensure Straight Alpha or Premultiplied is set
        footage.mainSource.hasAlpha = true;
        footage.mainSource.alphaMode = AlphaMode.PREMULTIPLIED;

        // Add footage layer to comp at current playhead
        var layer = comp.layers.add(footage);
        layer.startTime = comp.time;
        layer.moveToBeginning();
        
        // Enable motion blur if desired
        layer.motionBlur = true;
        comp.motionBlur = true;
    }

    app.endUndoGroup();
})();
