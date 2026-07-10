# encoding: UTF-8

require "json"

module MobiViewExporter

  module PiecesWriter

    extend self

    def write(pieces, folder)

      file = File.join(folder, "pieces.json")

      clean_pieces = pieces.map do |piece|
        {
          id: piece[:mv_uuid],
          persistent_id: piece[:persistent_id],
          code: piece[:code],
          name: piece[:name],
          module_id: piece[:module_id],
          material: piece[:material],
          geometry: piece[:geometry],
          transform: piece[:transform],
          sketchup: piece[:sketchup],
          dinabox: piece[:dinabox]
        }
      end

      File.open(file, "w:utf-8") do |f|
        f.write(JSON.pretty_generate(clean_pieces))
      end

      file

    end

  end

end